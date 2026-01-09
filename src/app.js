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
const DocxWriter = require('./docx/docxWriter');

class PinyinApp {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3004; // 支持从环境变量获取端口
    this.startTime = new Date();
    logger.info('应用初始化开始', { port: this.port });
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
          contentLength: res.get('Content-Length'),
          contentType: res.get('Content-Type')
        });
        originalEnd.apply(this, args);
      };
      
      next();
    });

    // 配置JSON解析器以正确处理UTF-8编码
    this.app.use(express.json({ 
      limit: '10mb',
      type: 'application/json',
      verify: (req, res, buf) => {
        // 确保正确处理UTF-8编码
        req.rawBody = buf.toString('utf8');
      }
    }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    // 设置字符编码中间件 - 只针对API响应设置JSON类型（如果还没有设置）
    this.app.use((req, res, next) => {
      // 只对API路由且未设置content-type的设置JSON content-type
      if (req.path.startsWith('/api/') && !res.getHeader('Content-Type')) {
        res.header('Content-Type', 'application/json; charset=utf-8');
      }
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      next();
    });
    
    this.app.use(express.static(path.join(__dirname, 'ui')));
    
    // Configure multer for file uploads
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '..', 'uploads');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + '.docx');
      }
    });
    
    this.upload = multer({ 
      storage: storage,
      fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
            file.originalname.endsWith('.docx')) {
          cb(null, true);
        } else {
          // Return error but don't call cb with error to avoid immediate rejection
          // The error will be caught by the error handling middleware
          cb(null, false);
          // Store error in request for later processing
          req.fileValidationError = 'Only DOCX files are allowed';
        }
      },
      limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
    });
  }

  initRoutes() {
    // API Routes
    this.app.post('/api/pinyin', this.generatePinyin.bind(this));
    this.app.post('/api/pinyin/docx', this.generateDocxPinyin.bind(this));
    this.app.post('/api/pinyin/docx/upload', (req, res, next) => {
      // Custom middleware to handle multer errors properly
      this.upload.single('file')(req, res, (err) => {
        if (err) {
          // Handle multer errors
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ success: false, error: 'File too large. Maximum size is 10MB' });
          }
          return next(err);
        }
        
        // If no file was uploaded but multer processed successfully
        if (!req.file && !req.fileValidationError) {
          return res.status(400).json({ success: false, error: 'No file uploaded' });
        }
        
        // Continue to the main handler
        next();
      });
    }, this.uploadDocxFile.bind(this));
    this.app.get('/api/pinyin/test', this.testPinyin.bind(this));

    // UI Routes
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, 'ui', 'index.html'));
    });

    // Error handling middleware - must be last
    this.app.use((error, req, res, next) => {
      logger.logError(error, '全局错误处理中间件');
      
      // Handle FormData parsing errors
      if (error.message && error.message.includes('Unexpected end of form')) {
        logger.warn('表单数据解析错误', { url: req.url, method: req.method });
        return res.status(400).json({ success: false, error: 'No file uploaded or invalid form data' });
      }
      
      // Handle file validation errors from multer
      if (req.fileValidationError) {
        logger.warn('文件验证错误', { error: req.fileValidationError, url: req.url });
        return res.status(400).json({ success: false, error: req.fileValidationError });
      }
      
      // Handle multer errors
      if (error.code === 'LIMIT_FILE_SIZE') {
        logger.warn('文件大小超出限制', { url: req.url, maxSize: '10MB' });
        return res.status(400).json({ success: false, error: 'File too large. Maximum size is 10MB' });
      }
      
      if (error.message && error.message.includes('Only DOCX files are allowed')) {
        logger.warn('文件格式不支持', { url: req.url, expectedFormat: 'DOCX' });
        return res.status(400).json({ success: false, error: 'Only DOCX files are allowed' });
      }
      
      if (error.message && error.message.includes('Unexpected field')) {
        logger.warn('文件字段名无效', { url: req.url });
        return res.status(400).json({ success: false, error: 'Invalid file field name' });
      }
      
      // Handle multer processing errors
      if (error.code === 'LIMIT_UNEXPECTED_FILE') {
        logger.warn('意外的文件字段', { url: req.url });
        return res.status(400).json({ success: false, error: 'Unexpected file field' });
      }
      
      // Default error response
      logger.error('未处理的错误', { 
        error: error.message, 
        url: req.url, 
        method: req.method,
        stack: error.stack 
      });
      res.status(500).json({ success: false, error: error.message || 'Internal server error' });
    });
  }

  async generatePinyin(req, res) {
    const startTime = Date.now();
    
    try {
      const { text, format = 'html', options = {} } = req.body;
      
      // 字符编码检测和修复
      let processedText = text;
      if (text && text.includes('?')) {
        // 如果包含问号，尝试从rawBody获取原始数据
        if (req.rawBody) {
          processedText = req.rawBody;
          logger.warn('检测到可能的字符编码问题，使用rawBody数据', { 
            originalLength: text.length,
            rawBodyLength: req.rawBody.length 
          });
        }
      }
      
      logger.info('拼音转换请求开始', { 
        textLength: processedText ? processedText.length : 0, 
        format, 
        options,
        textSample: processedText ? processedText.substring(0, 50) : '空文本',
        textCharCodes: processedText ? Array.from(processedText.substring(0, 10)).map(c => c.charCodeAt(0)).join(',') : '无',
        hasRawBody: !!req.rawBody
      });
      
      if (!text) {
        logger.warn('拼音转换请求缺少文本参数');
        return res.status(400).json({ error: 'Text is required' });
      }

      // 转换参数名称，前端使用charsPerLine，后端使用maxLineLength
      const backendOptions = { ...options };
      if (options.charsPerLine) {
        backendOptions.maxLineLength = options.charsPerLine;
        delete backendOptions.charsPerLine;
      }
      
      const processed = this.textProcessor.processDocxContent({ paragraphs: [{ text: processedText }] }, backendOptions);
      
      if (format === 'html') {
        const html = this.layoutGenerator.generateHtmlLayout(processed[0].lines, options);
        const duration = Date.now() - startTime;
        
        logger.info('拼音转换成功', { 
          textLength: text.length, 
          format, 
          duration,
          linesCount: processed[0].lines.length 
        });
        
        // Return both HTML and structured data
        res.json({ 
          success: true, 
          data: html, 
          structuredData: processed[0].lines, // Include structured data for frontend processing
          format: 'html' 
        });
      } else if (format === 'docx') {
        logger.warn('DOCX格式转换尚未实现');
        res.status(501).json({ success: false, error: 'DOCX generation not implemented yet' });
      } else {
        logger.warn('无效的格式参数', { format });
        res.status(400).json({ success: false, error: 'Invalid format' });
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.logError(error, '拼音转换失败');
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async generateDocxPinyin(req, res) {
    try {
      const { text, processedData } = req.body;
      
      logger.debug('DOCX生成请求', { hasText: !!text, hasProcessedData: !!processedData, processedDataLength: processedData?.length });
      
      if (!text && !processedData) {
        return res.status(400).json({ error: 'Text or processed data is required' });
      }

      let content;
      if (processedData) {
        // Use processed data if available - flatten the array of arrays
        content = Array.isArray(processedData) ? processedData.reduce((acc, val) => acc.concat(val), []) : processedData;
        logger.debug('使用processedData生成DOCX', { linesCount: processedData.length, flattenedLength: content.length });
      } else {
        // Process text if only raw text is provided
        logger.debug('使用原始文本生成DOCX', { textLength: text.length });
        const processed = this.textProcessor.processDocxContent({ paragraphs: [{ text }] });
        content = Array.isArray(processed[0].lines) ? processed[0].lines.reduce((acc, val) => acc.concat(val), []) : processed[0].lines;
        logger.debug('文本处理完成', { linesCount: processed[0].lines.length, flattenedLength: content.length });
      }

      // Generate DOCX file
      const tempFileName = `pinyin_${Date.now()}.docx`;
      const tempDir = path.join(__dirname, '..', 'temp');
      const tempFilePath = path.join(tempDir, tempFileName);
      
      // Ensure temp directory exists
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // Write DOCX file
      logger.debug('开始生成DOCX文件', { contentLength: content.length, tempFilePath });
      const doc = await this.docxWriter.writeDocx(content, tempFilePath);
      logger.debug('DOCX生成完成', { docType: typeof doc });
      
      // Write the document to file
      const buffer = await Packer.toBuffer(doc);
      fs.writeFileSync(tempFilePath, buffer);
      
      if (fs.existsSync(tempFilePath)) {
        const fileSize = fs.statSync(tempFilePath).size;
        logger.debug('DOCX文件生成成功', { filePath: tempFilePath, fileSize });
        
        // 只使用Base64返回，完全避免文件下载
        try {
          const fileBuffer = fs.readFileSync(tempFilePath);
          const base64Data = fileBuffer.toString('base64');
          
          // 清理临时文件
          if (fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
            logger.debug('临时文件已清理', { filePath: tempFilePath });
          }
          
          logger.debug('Base64数据发送成功', { dataLength: base64Data.length });
          
          // 只返回JSON，避免任何文件下载相关的头部设置
          res.json({ 
            success: true, 
            base64Data: base64Data,
            fileName: 'pinyin_output.docx',
            fileSize: fileSize
          });
          
        } catch (err) {
          logger.logError(err, 'Base64编码错误');
          if (fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
          }
          res.status(500).json({ success: false, error: 'Base64 encoding failed' });
        }
      } else {
        logger.error('DOCX生成失败', { result });
        res.status(500).json({ success: false, error: 'DOCX generation failed' });
      }
    } catch (error) {
      console.error('DOCX processing error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async uploadDocxFile(req, res) {
    const startTime = Date.now();
    
    try {
      if (!req.file) {
        if (req.fileValidationError) {
          logger.warn('DOCX文件上传验证失败', { error: req.fileValidationError });
          return res.status(400).json({ success: false, error: req.fileValidationError });
        }
        
        // Check if multer processed the request but found no valid file
        if (req.body && Object.keys(req.body).length === 0) {
          logger.warn('未上传文件');
          return res.status(400).json({ success: false, error: 'No file uploaded' });
        }
        
        logger.warn('文件上传无效');
        return res.status(400).json({ success: false, error: 'Invalid file or no file uploaded' });
      }

      logger.info('DOCX文件上传开始', { 
        filename: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        path: req.file.path
      });
      
      // Check if file is empty
      const stats = fs.statSync(req.file.path);
      if (stats.size === 0) {
        logger.warn('上传的文件为空', { filename: req.file.originalname });
        // Clean up empty file
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(400).json({ success: false, error: 'Uploaded file is empty' });
      }

      // Read and parse the DOCX file
      logger.debug('开始解析DOCX文件', { filename: req.file.originalname });
      const docxContent = await this.docxReader.readDocx(req.file.path);
      
      if (!docxContent.paragraphs || docxContent.paragraphs.length === 0) {
        logger.warn('DOCX文件中没有找到文本内容', { filename: req.file.originalname });
        return res.status(400).json({ success: false, error: 'No text content found in DOCX file' });
      }

      logger.info('DOCX文件解析成功', { 
        filename: req.file.originalname,
        paragraphCount: docxContent.paragraphs.length
      });
      
      // Process each paragraph with detailed analysis
      const processedParagraphs = [];
      let allOriginalText = '';
      let totalChineseChars = 0;
      
      for (let i = 0; i < docxContent.paragraphs.length; i++) {
        const paragraph = docxContent.paragraphs[i];
        const originalText = paragraph.text;
        
        if (originalText.trim()) {
          logger.debug(`处理段落 ${i + 1}`, { 
            text: originalText.substring(0, 100),
            length: originalText.length 
          });
          
          // Process the paragraph
          const processed = this.textProcessor.processDocxContent({ 
            paragraphs: [{ text: originalText }] 
          });
          
          if (processed.length > 0) {
            const chineseCount = processed[0].lines.flat().filter(item => item.isChinese).length;
            totalChineseChars += chineseCount;
            
            processedParagraphs.push({
              paragraphIndex: i + 1,
              originalText: originalText,
              processedLines: processed[0].lines,
              chineseCharacterCount: chineseCount,
              totalCharacterCount: originalText.length
            });
            
            allOriginalText += originalText + '\n';
          }
        }
      }

      if (processedParagraphs.length === 0) {
        logger.warn('DOCX文件中没有找到有效的中文文本', { filename: req.file.originalname });
        return res.status(400).json({ success: false, error: 'No valid Chinese text found in DOCX file' });
      }

      logger.info('段落处理完成', { 
        filename: req.file.originalname,
        processedParagraphs: processedParagraphs.length,
        totalChineseCharacters: totalChineseChars
      });
      
      // Generate HTML layout for all paragraphs
      const html = this.layoutGenerator.generateMultiParagraphHtml(processedParagraphs);
      
      // Clean up uploaded file
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
        logger.debug('上传的临时文件已清理', { filename: req.file.originalname });
      }
      
      res.json({
        success: true,
        data: html,
        originalText: allOriginalText.trim(),
        paragraphCount: processedParagraphs.length,
        totalChineseCharacters: processedParagraphs.reduce((sum, para) => sum + para.chineseCharacterCount, 0),
        structuredData: processedParagraphs.map(para => para.processedLines),
        format: 'html'
      });
      
    } catch (error) {
      console.error('DOCX upload error:', error);
      
      // Clean up uploaded file on error
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      
      res.status(500).json({ 
        success: false, 
        error: error.message || 'Failed to process DOCX file' 
      });
    }
  }

  async testPinyin(req, res) {
    try {
      const testText = '文本添加拼音';
      const pinyinText = this.pinyinConverter.formatPinyinText(testText);
      
      res.json({
        success: true,
        testText: testText,
        pinyinText: pinyinText,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Test pinyin error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  start() {
    logger.info('服务器启动中', { port: this.port });
    
    this.app.listen(this.port, () => {
      const uptime = Date.now() - this.startTime;
      logger.info('服务器启动成功', { 
        port: this.port, 
        uptime: `${uptime}ms`,
        pid: process.pid,
        nodeVersion: process.version,
        platform: process.platform
      });
      
      // 定期清理旧日志
      setInterval(() => {
        logger.cleanupOldLogs();
      }, 24 * 60 * 60 * 1000); // 每天清理一次
      
      console.log(`🚀 Pinyin App server running at http://localhost:${this.port}`);
      console.log(`📊 日志文件保存在: logs/app-${new Date().toISOString().split('T')[0]}.log`);
    });
    
    // 处理未捕获的异常
    process.on('uncaughtException', (error) => {
      logger.logError(error, '未捕获的异常');
      process.exit(1);
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('未处理的Promise拒绝', { reason, promise });
      process.exit(1);
    });
    
    // 优雅关闭
    process.on('SIGTERM', () => {
      logger.info('收到SIGTERM信号，正在关闭服务器...');
      process.exit(0);
    });
    
    process.on('SIGINT', () => {
      logger.info('收到SIGINT信号，正在关闭服务器...');
      process.exit(0);
    });
  }
}

// Only start the server if this file is run directly
if (require.main === module) {
  const app = new PinyinApp();
  app.start();
}

module.exports = PinyinApp;