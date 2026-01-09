// 修改generateDocx方法，只使用Base64返回
  async generateDocx(req, res) {
    try {
      const { text, options = {}, returnBase64 = true } = req.body;  // 默认使用Base64返回
      
      if (!text || !text.trim()) {
        return res.status(400).json({ 
          success: false, 
          error: 'Text is required' 
        });
      }

      logger.debug('开始生成DOCX', { 
        textLength: text.length, 
        options,
        returnBase64: true  // 强制使用Base64
      });

      // 转换拼音
      const converter = new PinyinConverter();
      const pinyinResult = converter.convert(text);
      
      // 处理文本
      const processor = new TextProcessor();
      const processedResult = processor.processText(pinyinResult, options);
      
      // 生成内容
      const content = {
        lines: processedResult.lines,
        metadata: {
          originalText: text,
          totalLines: processedResult.lines.length,
          maxLineLength: processedResult.maxLineLength || options.maxLineLength || 20,
          timestamp: new Date().toISOString()
        }
      };

      // 生成临时文件路径
      const tempDir = path.join(__dirname, '..', 'temp');
      const tempFileName = `pinyin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.docx`;
      const tempFilePath = path.join(tempDir, tempFileName);

      // 确保临时目录存在
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // 生成DOCX文件
      const result = await this.docxWriter.writeDocx(content, tempFilePath);
      
      if (result.success) {
        logger.debug('DOCX文件生成成功', { filePath: tempFilePath, fileSize: result.fileSize });
        
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
            fileSize: result.fileSize
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