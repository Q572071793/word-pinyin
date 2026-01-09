// 修改服务器端代码，完全避免文件下载，只使用Base64返回
const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const logger = require('./utils/logger');
const PinyinConverter = require('./core/pinyinConverter');
const TextProcessor = require('./core/textProcessor');
const LayoutGenerator = require('./core/layoutGenerator');
const DocxReader = require('./docx/docxReader');
const DocxWriter = require('./docx/docxWriter');

class PinyinApp {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3004;
    this.initMiddleware();
    this.initRoutes();
    this.initErrorHandling();
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

    // 静态文件服务
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
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
      fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
            file.originalname.toLowerCase().endsWith('.docx')) {
          cb(null, true);
        } else {
          req.fileValidationError = 'Only DOCX files are allowed';
          cb(null, false);
        }
      }
    });
  }

  initRoutes() {
    // API Routes
    this.app.post('/api/pinyin', this.convertText.bind(this));
    
    // 修改：只使用Base64返回，避免文件下载
    this.app.post('/api/pinyin/docx', this.generateDocxBase64.bind(this));
    
    this.app.post('/api/pinyin/docx/upload', (req, res, next) => {
      // Custom middleware to handle multer errors properly
      this.upload.single('file')(req, res, (err) => {
        if (err) {
          logger.warn('Multer错误', { error: err.message });
          return res.status(400).json({ success: false, error: err.message });
        }
        
        // Handle multer errors
        if (req.fileValidationError) {
          return res.status(400).json({ success: false, error: req.fileValidationError });
        }
        
        // If no file was uploaded but multer processed successfully
        if (!req.file) {
          return res.status(400).json({ success: false, error: 'No file uploaded' });
        }
        
        next();
      });
    }, this.uploadDocxFile.bind(this));

    // Serve the UI
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, 'ui', 'index.html'));
    });
  }

  initErrorHandling() {
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

  async convertText(req, res) {
    try {
      const { text, format = 'html', options = {} } = req.body;
      
      if (!text || !text.trim()) {
        return res.status(400).json({ 
          success: false, 
          error: 'Text is required' 
        });
      }

      logger.debug('开始转换文本', { 
        textLength: text.length, 
        format, 
        options 
      });

      // 转换拼音
      const converter = new PinyinConverter();
      const pinyinResult = converter.convert(text);
      
      // 处理文本（分行等）
      const processor = new TextProcessor();
      const processedResult = processor.processText(pinyinResult, options);
      
      // 生成布局
      const layoutGenerator = new LayoutGenerator();
      let result;
      
      if (format === 'html') {
        result = layoutGenerator.generateHTMLLayout(processedResult);
      } else if (format === 'json') {
        result = processedResult;
      } else {
        return res.status(400).json({ 
          success: false, 
          error: 'Unsupported format' 
        });
      }

      logger.debug('文本转换完成', { 
        originalLength: text.length,
        processedLength: processedResult.lines.length 
      });

      res.json({ 
        success: true, 
        data: result,
        structuredData: processedResult
      });

    } catch (error) {
      logger.logError(error, '文本转换错误');
      res.status(500).json({ 
        success: false, 
        error: 'Text conversion failed' 
      });
    }
  }

  // 修改：只使用Base64返回，避免文件下载
  async generateDocxBase64(req, res) {
    try {
      const { text, options = {} } = req.body;
      
      if (!text || !text.trim()) {
        return res.status(400).json({ 
          success: false, 
          error: 'Text is required' 
        });
      }

      logger.debug('开始生成DOCX', { 
        textLength: text.length, 
        options 
      });

      // 转换拼音
      const converter = new PinyinConverter();
      const pinyinResult = converter.convert(text);
      
      // 处理文本
      const processor = new TextProcessor();
      const processedResult = processor.processText(pinyinResult, options);
      
      // 生成DOCX文件
      const docxWriter = new DocxWriter();
      const docxBuffer = await docxWriter.generateDocx(processedResult);
      
      logger.debug('DOCX生成完成', { 
        bufferSize: docxBuffer.length,
        originalLength: text.length 
      });

      // 转换为Base64
      const base64Data = docxBuffer.toString('base64');
      
      logger.debug('Base64转换完成', { 
        base64Length: base64Data.length 
      });

      // 只返回JSON，避免任何文件下载相关的头部设置
      res.json({ 
        success: true, 
        base64Data: base64Data,
        fileName: 'pinyin_output.docx',
        fileSize: docxBuffer.length
      });

    } catch (error) {
      logger.logError(error, 'DOCX生成错误');
      res.status(500).json({ 
        success: false, 
        error: 'DOCX generation failed' 
      });
    }
  }

  async uploadDocxFile(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: 'No file uploaded' });
      }

      logger.debug('开始处理上传的DOCX文件', { 
        filename: req.file.originalname,
        size: req.file.size 
      });

      // 读取并解析DOCX文件
      const docxReader = new DocxReader();
      const textContent = await docxReader.readDocx(req.file.path);
      
      if (!textContent || !textContent.trim()) {
        // Clean up uploaded file
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(400).json({ 
          success: false, 
          error: 'No text content found in the DOCX file' 
        });
      }

      logger.debug('DOCX文件解析完成', { 
        textLength: textContent.length,
        filename: req.file.originalname 
      });

      // 转换拼音
      const converter = new PinyinConverter();
      const pinyinResult = converter.convert(textContent);
      
      // 处理文本
      const processor = new TextProcessor();
      const processedResult = processor.processText(pinyinResult);
      
      // 生成新的DOCX文件
      const docxWriter = new DocxWriter();
      const newDocxBuffer = await docxWriter.generateDocx(processedResult);

      // 转换为Base64返回
      const base64Data = newDocxBuffer.toString('base64');

      // Clean up uploaded file
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
        logger.debug('上传的临时文件已清理', { filename: req.file.originalname });
      }

      logger.debug('DOCX处理完成', { 
        originalLength: textContent.length,
        newFileSize: newDocxBuffer.length 
      });

      res.json({ 
        success: true, 
        base64Data: base64Data,
        fileName: `pinyin_${req.file.originalname}`,
        fileSize: newDocxBuffer.length,
        originalText: textContent
      });

    } catch (error) {
      logger.logError(error, 'DOCX上传处理错误');
      
      // Clean up uploaded file on error
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      
      res.status(500).json({ 
        success: false, 
        error: 'DOCX processing failed' 
      });
    }
  }

  start() {
    this.app.listen(this.port, () => {
      logger.info(`拼音转换服务启动`, { port: this.port });
      console.log(`Server running on http://localhost:${this.port}`);
    });
  }
}

module.exports = PinyinApp;