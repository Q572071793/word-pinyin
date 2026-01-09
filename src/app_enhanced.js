const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { Packer } = require('docx');
const logger = require('./utils/logger');
const PinyinConverter = require('./core/pinyinConverter');
const TextProcessor = require('./core/textProcessor');
const LayoutGenerator = require('./core/layoutGenerator');
const DocxReader = require('./docx/docxReader');
const DocxWriter = require('./docx/docxWriter_simple');
const PDFWriter = require('./pdf/pdfWriter');
const PortManager = require('./utils/portManager');
const BrowserLauncher = require('./utils/browserLauncher');
const HtmlFormatConverter = require('./utils/htmlFormatConverter');

class PinyinApp {
  constructor() {
    this.app = express();
    this.portManager = new PortManager();
    this.browserLauncher = new BrowserLauncher();
    this.port = null; // 将在启动时动态分配
    this.startTime = new Date();
    
    logger.info('应用初始化开始');
    this.initServices();
    this.initMiddleware();
    this.initRoutes();
    logger.info('应用初始化完成');
  }

  initServices() {
    this.pinyinConverter = new PinyinConverter();
    this.textProcessor = new TextProcessor();
    this.layoutGenerator = new LayoutGenerator();
    this.docxReader = new DocxReader();
    this.docxWriter = new DocxWriter();
    this.pdfWriter = new PDFWriter();
    this.htmlFormatConverter = new HtmlFormatConverter();
  }

  initMiddleware() {
    // 请求日志中间件
    this.app.use((req, res, next) => {
      const startTime = Date.now();
      
      // 记录请求开始
      logger.debug(`请求开始: ${req.method} ${req.url}`, {
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      // 重写res.end来捕获响应信息
      const originalEnd = res.end;
      res.end = function(...args) {
        const duration = Date.now() - startTime;
        logger.logRequest(req.method, req.url, res.statusCode, duration, {
          contentType: res.get('Content-Type'),
          contentLength: res.get('Content-Length')
        });
        
        // 错误响应额外记录
        if (res.statusCode >= 400) {
          logger.warn(`请求错误: ${res.statusCode}`, {
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            duration
          });
        }
        
        originalEnd.apply(this, args);
      };
      
      next();
    });

    // 静态文件服务
    this.app.use(express.static(path.join(__dirname, 'ui')));
    this.app.use('/temp', express.static(path.join(__dirname, '../temp')));
    
    // JSON解析中间件
    this.app.use(express.json({ limit: '50mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '50mb' }));
    
    // CORS中间件
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      
      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
      } else {
        next();
      }
    });
    
    // 文件上传中间件
    this.upload = multer({ 
      dest: 'temp/',
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB限制
      fileFilter: (req, file, cb) => {
        // 只允许特定文件类型
        const allowedTypes = ['.docx', '.doc', '.txt'];
        const ext = path.extname(file.originalname).toLowerCase();
        
        if (allowedTypes.includes(ext)) {
          cb(null, true);
        } else {
          cb(new Error('不支持的文件类型'), false);
        }
      }
    });
  }

  initRoutes() {
    // 根路由
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, '../ui/index.html'));
    });

    // 健康检查
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        uptime: Date.now() - this.startTime,
        port: this.port
      });
    });

    // 端口信息
    this.app.get('/api/port-info', async (req, res) => {
      try {
        const portInfo = await this.portManager.getPortUsageInfo();
        res.json({
          success: true,
          currentPort: this.port,
          portInfo: portInfo
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    // 拼音转换API
    this.app.post('/api/pinyin', async (req, res) => {
      try {
        const { text, format = 'json', options = {} } = req.body;
        
        if (!text || typeof text !== 'string') {
          return res.status(400).json({ 
            success: false, 
            error: '文本内容不能为空' 
          });
        }

        logger.info('收到拼音转换请求', { 
          textLength: text.length, 
          format, 
          options 
        });

        // 处理文本
        const processedContent = this.textProcessor.processDocxContent({ 
          paragraphs: [{ text }] 
        });

        // 提取所有行数据用于布局生成
        const allLines = processedContent.flatMap(para => para.lines);

        // 根据格式生成不同的结果
        let result;
        if (format === 'json') {
          // JSON格式返回原始数据结构
          result = allLines;
          logger.info('拼音转换完成(JSON格式)', { 
            linesCount: result.length 
          });
        } else {
          // HTML格式返回HTML布局
          result = this.layoutGenerator.generateHtmlLayout(allLines, options);
          logger.info('拼音转换完成(HTML格式)', { 
            linesCount: result.length 
          });
        }

        res.json({ 
          success: true, 
          data: result,
          format: format
        });

      } catch (error) {
        logger.error('拼音转换错误', { error: error.message });
        res.status(500).json({ 
          success: false, 
          error: error.message 
        });
      }
    });

    // DOCX生成API
    this.app.post('/api/pinyin/docx', async (req, res) => {
      try {
        const { processedData, text, options = {} } = req.body;
        
        if (!processedData && !text) {
          return res.status(400).json({ 
            success: false, 
            error: '需要processedData或text参数' 
          });
        }

        logger.info('收到DOCX生成请求');

        let content;
        
        if (processedData) {
          // 使用已处理的数据
          // 检查数据格式，如果是HTML字符串，转换为DOCX格式
          if (typeof processedData === 'string' && processedData.includes('<div class="pinyin-')) {
            logger.debug('检测到HTML格式数据，转换为DOCX格式');
            content = this.htmlFormatConverter.convertToDocxFormat(processedData);
          } else {
            content = processedData.flat ? processedData.flat() : processedData;
          }
          logger.debug('使用processedData生成DOCX', { linesCount: content.length });
        } else {
          // 处理文本
          logger.debug('使用原始文本生成DOCX', { textLength: text.length });
          const processed = this.textProcessor.processDocxContent({ paragraphs: [{ text }] });
          content = processed[0].lines.flat();
          logger.debug('文本处理完成', { linesCount: content.length });
        }

        // 生成DOCX文件
        const outputPath = path.join(process.cwd(), `temp/pinyin_${Date.now()}.docx`);
        await this.docxWriter.write(content, { outputPath });

        // 读取文件并转换为Base64
        const docxBuffer = fs.readFileSync(outputPath);
        const base64Data = docxBuffer.toString('base64');

        // 清理临时文件
        fs.unlinkSync(outputPath);

        logger.info('DOCX生成完成', { 
          fileSize: docxBuffer.length,
          base64Length: base64Data.length 
        });

        res.json({ 
          success: true, 
          base64Data,
          filename: `pinyin_output_${Date.now()}.docx`
        });

      } catch (error) {
        logger.error('DOCX生成错误', { error: error.message });
        res.status(500).json({ 
          success: false, 
          error: error.message 
        });
      }
    });

    // PDF生成API
    this.app.post('/api/pinyin/pdf', async (req, res) => {
      try {
        const { processedData, text, options = {} } = req.body;
        
        if (!processedData && !text) {
          return res.status(400).json({ 
            success: false, 
            error: '需要processedData或text参数' 
          });
        }

        logger.info('收到PDF生成请求');

        let content;
        
        if (processedData) {
          // 检查数据格式，如果是HTML字符串，转换为PDF格式
          if (typeof processedData === 'string' && processedData.includes('<div class="pinyin-')) {
            logger.debug('检测到HTML格式数据，转换为PDF格式');
            content = this.htmlFormatConverter.convertToPdfFormat(processedData);
          } else {
            content = processedData.flat ? processedData.flat() : processedData;
          }
          logger.debug('使用processedData生成PDF', { linesCount: content.length });
        } else {
          logger.debug('使用原始文本生成PDF', { textLength: text.length });
          const processed = this.textProcessor.processDocxContent({ paragraphs: [{ text }] });
          content = processed[0].lines.flat();
          logger.debug('文本处理完成', { linesCount: content.length });
        }

        // 生成PDF的Base64数据
        const base64Data = await this.pdfWriter.generateBase64(content, options);

        logger.info('PDF生成完成', { 
          base64Length: base64Data.length 
        });

        res.json({ 
          success: true, 
          base64Data,
          filename: `pinyin_output_${Date.now()}.pdf`
        });

      } catch (error) {
        logger.error('PDF生成错误', { error: error.message });
        res.status(500).json({ 
          success: false, 
          error: error.message 
        });
      }
    });

    // 文件上传API
    this.app.post('/api/upload', this.upload.single('file'), async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ 
            success: false, 
            error: '没有上传文件' 
          });
        }

        logger.info('收到文件上传', { 
          filename: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype
        });

        const filePath = req.file.path;
        const extension = path.extname(req.file.originalname).toLowerCase();
        
        let result;
        
        if (extension === '.docx') {
          result = await this.docxReader.read(filePath);
        } else if (extension === '.txt') {
          const content = fs.readFileSync(filePath, 'utf-8');
          result = { text: content };
        } else {
          throw new Error('不支持的文件类型');
        }

        // 清理上传的临时文件
        fs.unlinkSync(filePath);

        res.json({ 
          success: true, 
          data: result,
          filename: req.file.originalname
        });

      } catch (error) {
        logger.error('文件处理错误', { error: error.message });
        
        // 清理上传的临时文件
        if (req.file && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        
        res.status(500).json({ 
          success: false, 
          error: error.message 
        });
      }
    });

    // 错误处理中间件
    this.app.use((error, req, res, next) => {
      logger.error('未处理的错误', { 
        error: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method
      });
      
      res.status(500).json({ 
        success: false, 
        error: '服务器内部错误' 
      });
    });

    // 404处理
    this.app.use((req, res) => {
      logger.warn('请求的资源不存在', { 
        url: req.url,
        method: req.method
      });
      
      res.status(404).json({ 
        success: false, 
        error: '资源不存在' 
      });
    });
  }

  async start() {
    try {
      // 动态分配端口
      const preferredPorts = [80, 8080, 3000, 3001, 3002, 3003, 3004];
      this.port = await this.portManager.findAvailablePort(preferredPorts);
      
      logger.info('端口分配完成', { port: this.port });
      
      // 启动服务器
      this.server = this.app.listen(this.port, () => {
        const uptime = Date.now() - this.startTime;
        logger.info('服务器启动成功', { 
          port: this.port, 
          uptime: `${uptime}ms`,
          pid: process.pid,
          nodeVersion: process.version,
          platform: process.platform
        });
        
        console.log(`🚀 Pinyin App server running at http://localhost:${this.port}`);
        console.log(`📊 日志文件保存在: logs/app-${new Date().toISOString().split('T')[0]}.log`);
        
        // 自动打开浏览器
        this.openBrowserAutomatically();
      });

      // 定期清理旧日志
      setInterval(() => {
        logger.cleanupOldLogs();
      }, 24 * 60 * 60 * 1000); // 每天清理一次
      
    } catch (error) {
      logger.error('服务器启动失败', { error: error.message });
      console.error('❌ 服务器启动失败:', error.message);
      process.exit(1);
    }
  }

  async openBrowserAutomatically() {
    try {
      const url = `http://localhost:${this.port}`;
      
      // 延迟2秒后打开浏览器，确保服务器完全启动
      setTimeout(async () => {
        try {
          await this.browserLauncher.openBrowserWithDelay(url, 0);
          logger.info('浏览器已自动打开', { url });
        } catch (error) {
          logger.warn('自动打开浏览器失败', { error: error.message });
          console.log(`📱 请手动打开浏览器访问: ${url}`);
        }
      }, 2000);
      
    } catch (error) {
      logger.warn('自动打开浏览器出错', { error: error.message });
    }
  }

  stop() {
    if (this.server) {
      this.server.close(() => {
        logger.info('服务器已停止');
        console.log('👋 服务器已停止');
      });
    }
  }
}

// 处理进程信号
process.on('SIGTERM', () => {
  logger.info('收到SIGTERM信号，正在关闭服务器...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('收到SIGINT信号，正在关闭服务器...');
  process.exit(0);
});

// 未捕获异常处理
process.on('uncaughtException', (error) => {
  logger.error('未捕获的异常', { error: error.message, stack: error.stack });
  console.error('❌ 未捕获的异常:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('未处理的Promise拒绝', { reason, promise });
  console.error('❌ 未处理的Promise拒绝:', reason);
  process.exit(1);
});

// 只在直接运行时启动服务器
if (require.main === module) {
  const app = new PinyinApp();
  app.start();
}

module.exports = PinyinApp;