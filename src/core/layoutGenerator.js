const logger = require('../utils/logger');

class LayoutGenerator {
  constructor() {
    this.defaultConfig = {
      boxWidth: 40,
      boxHeight: 60,
      fontSize: 16,
      pinyinFontSize: 12,
      charHeight: 30,
      pinyinHeight: 20,
      boxMargin: 5,
      fontFamily: 'SimSun, serif'
    };
    
    logger.debug('LayoutGenerator初始化完成');
  }

  generateHtmlLayout(items, config = {}) {
    const startTime = Date.now();
    
    try {
      logger.debug('开始生成HTML布局', { 
        linesCount: items.length, 
        config: Object.keys(config).length > 0 ? '自定义配置' : '默认配置' 
      });
      
      const mergedConfig = { ...this.defaultConfig, ...config };
      let html = '<div class="pinyin-container" style="font-family: ' + mergedConfig.fontFamily + '; line-height: 1.6;">';
      
      let chineseCharCount = 0;
      let nonChineseCharCount = 0;
      
      for (const line of items) {
        html += '<div class="pinyin-line" style="margin: 15px 0; text-align: left; display: flex; flex-wrap: wrap; align-items: flex-end;">';
        
        for (const item of line) {
          if (item.isChinese) {
            chineseCharCount++;
            // 判断字符类型，优化显示位置
            const charClass = this.getCharacterClass(item.character);
            const alignmentStyle = this.getAlignmentStyle(charClass);
            
            html += `
              <div class="pinyin-item ${charClass}" style="margin: 0 ${mergedConfig.boxMargin / 2}px 5px 0; display: inline-flex; flex-direction: column; vertical-align: bottom;">
                <div class="pinyin-text" style="width: ${mergedConfig.boxWidth}px; height: ${mergedConfig.pinyinHeight}px; font-size: ${mergedConfig.pinyinFontSize}px; text-align: center; line-height: ${mergedConfig.pinyinHeight}px; margin-bottom: 2px;">${item.pinyin}</div>
                <div class="pinyin-box" style="width: ${mergedConfig.boxWidth}px; height: ${mergedConfig.charHeight}px; border: 1px solid #000; display: flex; ${alignmentStyle}; box-sizing: border-box; background: white;">
                  <div class="character-text" style="font-size: ${mergedConfig.fontSize}px;">${item.character}</div>
                </div>
              </div>
            `;
          } else {
            nonChineseCharCount++;
            // 对于非中文字符，根据字符类型调整位置
            const isPunctuation = /[，。！？；：","（）《》【】]/.test(item.character);
            const isSpecialDot = item.character === '·';
            
            let extraStyle = "";
            if (isPunctuation) {
              extraStyle = 'vertical-align: bottom; margin-bottom: 3px;';
            } else if (isSpecialDot) {
              extraStyle = 'vertical-align: middle; margin-bottom: 8px;';
            }
            
            html += `<span class="non-chinese" style="display: inline-block; line-height: ${mergedConfig.charHeight}px; margin: 0 ${mergedConfig.boxMargin / 4}px 5px 0; ${extraStyle}">${item.character}</span>`;
          }
        }
        html += '</div>';
      }
      html += '</div>';
      
      const duration = Date.now() - startTime;
      logger.info('HTML布局生成完成', { 
        linesCount: items.length, 
        chineseCharCount, 
        nonChineseCharCount, 
        duration,
        htmlLength: html.length 
      });
      
      return html;
    } catch (error) {
      logger.logError(error, 'HTML布局生成失败');
      throw error;
    }
  }

  // 获取字符分类
  getCharacterClass(character) {
    // 右下角对齐的符号
    const bottomRightChars = ['像', '。', '，', '！', '？', '；', '：', '）', '】', '》', '"', "'"];
    // 中间对齐的符号
    const middleChars = ['·', '•', '·'];
    
    if (bottomRightChars.includes(character)) {
      return 'bottom-right';
    } else if (middleChars.includes(character)) {
      return 'middle-align';
    }
    return 'normal';
  }

  // 获取对齐样式
  getAlignmentStyle(charClass) {
    switch (charClass) {
      case 'bottom-right':
        return 'align-items: flex-end; justify-content: flex-end;';
      case 'middle-align':
        return 'align-items: center; justify-content: center;';
      default:
        return 'align-items: center; justify-content: center;';
    }
  }

  generateDocxLayout(items, config = {}) {
    // This will be implemented to generate DOCX content with proper layout
    // For now, returning a placeholder
    return {
      paragraphs: items.map(line => {
        return {
          text: line.map(item => item.character).join(''),
          pinyin: line.map(item => item.pinyin || '').join(' ')
        };
      })
    };
  }

  // Generate HTML layout for multiple paragraphs with detailed analysis
  generateMultiParagraphHtml(paragraphs, config = {}) {
    const mergedConfig = { ...this.defaultConfig, ...config };
    let html = '<div class="pinyin-document" style="font-family: ' + mergedConfig.fontFamily + '; padding: 20px;">';
    
    // Add document summary
    const totalParagraphs = paragraphs.length;
    const totalChineseChars = paragraphs.reduce((sum, para) => sum + para.chineseCharacterCount, 0);
    
    html += `
      <div class="document-summary" style="background: #f0f8ff; padding: 15px; margin-bottom: 20px; border-radius: 8px; border-left: 4px solid #667eea;">
        <h3 style="margin: 0 0 10px 0; color: #667eea;">📋 文档分析结果</h3>
        <div style="display: flex; gap: 20px; flex-wrap: wrap;">
          <div><strong>段落数量:</strong> ${totalParagraphs}</div>
          <div><strong>中文字符:</strong> ${totalChineseChars}</div>
          <div><strong>处理状态:</strong> <span style="color: #28a745;">✅ 完成</span></div>
        </div>
      </div>
    `;
    
    // Process each paragraph
    for (let i = 0; i < paragraphs.length; i++) {
      const para = paragraphs[i];
      
      html += `
        <div class="paragraph-container" style="margin-bottom: 25px; padding: 15px; border: 1px solid #e9ecef; border-radius: 8px;">
          <div class="paragraph-header" style="margin-bottom: 10px; font-size: 14px; color: #6c757d;">
            📄 段落 ${i + 1} | 中文字符: ${para.chineseCharacterCount} | 总字符: ${para.totalCharacterCount}
          </div>
          <div class="paragraph-content">
      `;
      
      // Generate pinyin layout for this paragraph
      const paraHtml = this.generateHtmlLayout(para.processedLines, config);
      html += paraHtml;
      
      html += '</div></div>';
    }
    
    html += '</div>';
    return html;
  }
}

module.exports = LayoutGenerator;