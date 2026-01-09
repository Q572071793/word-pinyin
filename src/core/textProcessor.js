const PinyinConverter = require('./pinyinConverter');
const logger = require('../utils/logger');

class TextProcessor {
  constructor() {
    this.pinyinConverter = new PinyinConverter();
    logger.debug('TextProcessor初始化完成');
  }

  processText(text) {
    const startTime = Date.now();
    
    try {
      if (!text) {
        logger.debug('处理空文本');
        return [];
      }
      
      logger.debug('开始处理文本', { textLength: text.length });
      
      const pinyinPairs = this.pinyinConverter.getPinyinPairs(text);
      
      const result = pinyinPairs.map((pair, index) => {
        return {
          id: index + 1,
          character: pair.char,
          pinyin: pair.pinyin,
          isChinese: this.pinyinConverter.isChineseChar(pair.char),
          hasPinyin: !!pair.pinyin
        };
      });
      
      const chineseCount = result.filter(item => item.isChinese).length;
      const duration = Date.now() - startTime;
      
      logger.info('文本处理完成', { 
        textLength: text.length, 
        chineseCount, 
        totalItems: result.length,
        duration 
      });
      
      return result;
    } catch (error) {
      logger.logError(error, '文本处理失败');
      throw error;
    }
  }

  splitTextIntoLines(items, maxLineLength = 20) {
    const startTime = Date.now();
    
    try {
      if (!items || items.length === 0) {
        logger.debug('处理空数据行分割');
        return [];
      }
      
      logger.debug('开始数据行分割', { itemsLength: items.length, maxLineLength });
      
      // 首先根据回车符分割成段落
      let currentText = '';
      const paragraphs = [];
      let currentParagraph = [];
      
      for (const item of items) {
        if (item.character === '\n' || item.character === '\r') {
          // 遇到换行符，结束当前段落
          if (currentParagraph.length > 0) {
            paragraphs.push(currentParagraph);
            currentParagraph = [];
          }
        } else {
          currentParagraph.push(item);
        }
      }
      
      // 添加最后一个段落
      if (currentParagraph.length > 0) {
        paragraphs.push(currentParagraph);
      }
      
      const allLines = [];
      
      for (const paragraphItems of paragraphs) {
        if (paragraphItems.length === 0) {
          // 空段落也保留一个空行
          allLines.push([]);
          continue;
        }
        
        const lines = this.wrapLine(paragraphItems, maxLineLength);
        allLines.push(...lines);
      }
      
      const duration = Date.now() - startTime;
      logger.info('数据行分割完成', { 
        originalParagraphs: paragraphs.length, 
        totalLines: allLines.length,
        duration      });
      
      return allLines;
    } catch (error) {
      logger.logError(error, '数据行分割失败');
      throw error;
    }
  }

  // 处理单行文本的自动换行
  wrapLine(items, maxLineLength = 20) {
    const lines = [];
    let currentLine = [];
    let currentLength = 0;
    
    for (const item of items) {
      const charLength = item.isChinese ? 2 : 1;
      
      // 如果当前行加上新字符会超过长度限制，则换行
      if (currentLength + charLength > maxLineLength) {
        lines.push(currentLine);
        currentLine = [item];
        currentLength = charLength;
      } else {
        currentLine.push(item);
        currentLength += charLength;
      }
    }
    
    // 添加最后一行
    if (currentLine.length > 0) {
      lines.push(currentLine);
    }
    
    return lines;
  }

  processDocxContent(docxContent, options = {}) {
    const paragraphs = [];
    const maxLineLength = options.maxLineLength || 20;
    
    if (docxContent && docxContent.paragraphs) {
      for (const para of docxContent.paragraphs) {
        const text = para.text || '';
        if (text.trim()) {
          const processed = this.processText(text);
          const lines = this.splitTextIntoLines(processed, maxLineLength); // 使用处理后的数据和配置的行长度
          paragraphs.push({
            original: text,
            processed: processed,
            lines: lines,
            paragraphCount: lines.length
          });
        }
      }
    }
    
    return paragraphs;
  }

  mergeConsecutiveNonChinese(items) {
    const merged = [];
    let currentNonChinese = '';
    
    for (const item of items) {
      if (item.isChinese) {
        if (currentNonChinese) {
          merged.push({
            id: merged.length + 1,
            character: currentNonChinese,
            pinyin: '',
            isChinese: false,
            hasPinyin: false
          });
          currentNonChinese = '';
        }
        merged.push(item);
      } else {
        currentNonChinese += item.character;
      }
    }
    
    if (currentNonChinese) {
      merged.push({
        id: merged.length + 1,
        character: currentNonChinese,
        pinyin: '',
        isChinese: false,
        hasPinyin: false
      });
    }
    
    return merged;
  }
}

module.exports = TextProcessor;