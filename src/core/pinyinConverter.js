const { pinyin } = require('pinyin');
const logger = require('../utils/logger');

class PinyinConverter {
  constructor() {
    this.options = {
      style: pinyin.STYLE_NORMAL,
      heteronym: false
    };
    
    logger.debug('PinyinConverter初始化完成');
  }

  convertToPinyin(text) {
    const startTime = Date.now();
    
    try {
      if (!text) {
        logger.debug('转换空文本为拼音');
        return '';
      }
      
      logger.debug('开始转换文本为拼音', { textLength: text.length });
      
      const result = pinyin(text, this.options);
      const pinyinText = result.map(item => item[0]).join('');
      
      const duration = Date.now() - startTime;
      logger.info('文本转拼音完成', { 
        originalLength: text.length, 
        resultLength: pinyinText.length,
        duration 
      });
      
      return pinyinText;
    } catch (error) {
      logger.logError(error, '文本转拼音失败');
      throw error;
    }
  }

  convertToPinyinWithTone(text) {
    if (!text) return '';
    
    const options = {
      ...this.options,
      style: pinyin.STYLE_TONE
    };
    
    const result = pinyin(text, options);
    return result.map(item => item[0]).join('');
  }

  convertToPinyinWithNumberTone(text) {
    if (!text) return '';
    
    const options = {
      ...this.options,
      style: pinyin.STYLE_TONE2
    };
    
    const result = pinyin(text, options);
    return result.map(item => item[0]).join('');
  }

  convertCharToPinyin(char) {
    if (!char || char.length !== 1) return '';
    
    const options = {
      ...this.options,
      style: pinyin.STYLE_TONE
    };
    
    const result = pinyin(char, options);
    return result[0][0] || '';
  }

  isChineseChar(char) {
    return /[\u4e00-\u9fa5]/.test(char);
  }

  getPinyinPairs(text) {
    const startTime = Date.now();
    
    try {
      if (!text) {
        logger.debug('获取空文本的拼音对');
        return [];
      }
      
      logger.debug('开始获取拼音对', { textLength: text.length });
      
      const pairs = [];
      let chineseCount = 0;
      
      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (this.isChineseChar(char)) {
          chineseCount++;
          const py = this.convertCharToPinyin(char);
          pairs.push({ char, pinyin: py });
        } else {
          pairs.push({ char, pinyin: '' });
        }
      }
      
      const duration = Date.now() - startTime;
      logger.info('拼音对获取完成', { 
        textLength: text.length, 
        chineseCount, 
        totalPairs: pairs.length,
        duration 
      });
      
      return pairs;
    } catch (error) {
      logger.logError(error, '获取拼音对失败');
      throw error;
    }
  }

  formatPinyinText(text) {
    const pairs = this.getPinyinPairs(text);
    return pairs.map(pair => {
      if (pair.pinyin) {
        return `${pair.char}(${pair.pinyin})`;
      }
      return pair.char;
    }).join('');
  }
}

module.exports = PinyinConverter;