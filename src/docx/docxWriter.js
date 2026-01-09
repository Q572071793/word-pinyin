const { Document, Paragraph, TextRun, Table, TableRow, TableCell, AlignmentType, WidthType, VerticalAlign, BorderStyle } = require('docx');

// 安全地导入logger，如果失败则使用console
let logger;
try {
  logger = require('../utils/logger').logger;
} catch (error) {
  console.warn('Logger import failed, using console fallback:', error.message);
  logger = {
    info: console.log,
    warn: console.warn,
    error: console.error,
    debug: console.debug
  };
}

class DocxWriter {
  constructor() {
    this.name = 'DocxWriter';
  }

  write(processedData, options = {}) {
    if (logger && logger.info) {
      logger.info('开始生成DOCX文档', { 
        outputPath: options.outputPath,
        contentType: typeof processedData 
      });
    }

    try {
      // 确保有默认选项
      const mergedOptions = {
        pageSize: 'A4',
        orientation: 'portrait',
        pinyinFontSize: 10,
        characterFontSize: 16,
        fontFamily: 'Microsoft YaHei',
        lineSpacing: 1.5,
        boxBorder: true,
        includePinyin: true,
        includeStatistics: false,
        layoutStyle: 'table', // 'table', 'inline', 'bracket'
        charsPerLine: 12,
        ...options
      };

      // 选择布局方式
      if (logger && logger.info) {
        logger.info('选择布局方式', {});
      }
      let content;
      
      if (mergedOptions.layoutStyle === 'inline') {
        if (logger && logger.info) {
          logger.info('使用内联布局');
        }
        content = this.createInlinePinyinParagraph(processedData, mergedOptions);
      } else if (mergedOptions.layoutStyle === 'bracket') {
        if (logger && logger.info) {
          logger.info('使用括号布局');
        }
        content = this.createBracketPinyinParagraph(processedData, mergedOptions);
      } else {
        if (logger && logger.info) {
          logger.info('使用表格布局（默认）');
        }
        content = this.createTablePinyinParagraph(processedData, mergedOptions);
      }

      // 创建文档
      const doc = new Document({
        sections: [{
          properties: {
            page: {
              size: {
                width: mergedOptions.pageSize === 'A4' ? 11906 : 12240,
                height: mergedOptions.pageSize === 'A4' ? 16838 : 15840,
              },
              margin: {
                top: 1440,
                right: 1440,
                bottom: 1440,
                left: 1440,
              },
            },
          },
          children: Array.isArray(content) ? content : [content]
        }]
      });

      if (logger && logger.info) {
        logger.info('DOCX文档生成完成', { success: true });
      }
      return doc;
    } catch (error) {
      if (logger && logger.error) {
        logger.error('DOCX生成失败', error);
      }
      throw error;
    }
  }

  createTablePinyinParagraph(processedItems, options) {
    if (logger && logger.info) {
      logger.info('createTablePinyinParagraph开始', { 
        processedItemsLength: processedItems.length,
        options: JSON.stringify(options)
      });
    }
    
    // Create a table with pinyin above characters
    const tableRows = [];
    
    // First row: Pinyin
    const pinyinCells = [];
    // Second row: Characters
    const charCells = [];
    
    let chineseCount = 0;
    
    for (const item of processedItems) {
      if (item.isChinese && item.hasPinyin && options.includePinyin) {
        chineseCount++;
        // Add pinyin cell
        pinyinCells.push(new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: item.pinyin,
                  size: options.pinyinFontSize * 2, // docx uses half-points
                  font: 'Arial',
                  bold: true,
                  color: options.pinyinColor || '000000'
                })
              ],
              alignment: AlignmentType.CENTER
            })
          ],
          width: {
            size: 10,
            type: WidthType.PERCENTAGE
          },
          verticalAlign: VerticalAlign.CENTER,
          margins: {
            top: 50,
            bottom: 50,
            left: 50,
            right: 50
          }
        }));
        
        // Add character cell
        charCells.push(new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: item.character,
                  size: options.characterFontSize * 2,
                  font: 'Microsoft YaHei',
                  bold: options.characterBold || false,
                  color: options.characterColor || '000000'
                })
              ],
              alignment: AlignmentType.CENTER
            })
          ],
          width: {
            size: 10,
            type: WidthType.PERCENTAGE
          },
          verticalAlign: VerticalAlign.CENTER,
          borders: options.boxBorder ? {
            top: { style: 'single', size: 6, color: '000000' },
            bottom: { style: 'single', size: 6, color: '000000' },
            left: { style: 'single', size: 6, color: '000000' },
            right: { style: 'single', size: 6, color: '000000' }
          } : {},
          margins: {
            top: 100,
            bottom: 100,
            left: 100,
            right: 100
          }
        }));
      } else {
        // Non-Chinese characters - just add character cell
        const charClass = item.character ? this.getCharacterClass(item.character) : 'other';
        const alignmentStyle = this.getCharacterAlignment(charClass);
        
        pinyinCells.push(new TableCell({
          children: [new Paragraph('')],
          width: {
            size: 5,
            type: WidthType.PERCENTAGE
          },
          verticalAlign: alignmentStyle.verticalAlign
        }));
        
        charCells.push(new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: item.character || '',
                  size: options.characterFontSize * 2,
                  font: 'Arial',
                  color: options.characterColor || '000000'
                })
              ],
              alignment: alignmentStyle.alignment
            })
          ],
          width: {
            size: 5,
            type: WidthType.PERCENTAGE
          },
          verticalAlign: alignmentStyle.verticalAlign,
          margins: {
            top: 50,
            bottom: 50,
            left: 50,
            right: 50
          }
        }));
      }
    }
    
    if (logger && logger.info) {
      logger.info('创建拼音表格段落', { chineseCount, totalItems: processedItems.length, pinyinCellsLength: pinyinCells.length, charCellsLength: charCells.length });
    }
    
    // Create table with pinyin row and character row
    const table = new Table({
      rows: [
        new TableRow({ children: pinyinCells }),
        new TableRow({ children: charCells })
      ],
      width: {
        size: options.tableWidth || 100,
        type: WidthType.PERCENTAGE
      },
      margins: {
        top: 100,
        bottom: 100
      }
    });
    
    if (logger && logger.info) {
      logger.info('表格创建完成', { tableCreated: true });
    }
    
    // Return the table directly - tables should not be wrapped in paragraphs
    return table;
  }

  createInlinePinyinParagraph(processedItems, options) {
    // 创建内联拼音格式：拼音(汉字)
    const runs = [];
    
    for (const item of processedItems) {
      if (item.isChinese && item.hasPinyin && options.includePinyin) {
        runs.push(new TextRun({
          text: item.pinyin,
          size: options.pinyinFontSize * 2,
          font: 'Arial',
          color: options.pinyinColor || '000000',
          superscript: true
        }));
        runs.push(new TextRun({
          text: item.character,
          size: options.characterFontSize * 2,
          font: 'Microsoft YaHei',
          color: options.characterColor || '000000'
        }));
      } else {
        runs.push(new TextRun({
          text: item.character,
          size: options.characterFontSize * 2,
          font: 'Arial',
          color: options.characterColor || '000000'
        }));
      }
    }
    
    return new Paragraph({
      children: runs,
      spacing: {
        line: options.lineSpacing * 240
      }
    });
  }

  createBracketPinyinParagraph(processedItems, options) {
    // 创建括号拼音格式：汉字(拼音)
    const runs = [];
    
    for (const item of processedItems) {
      if (item.isChinese && item.hasPinyin && options.includePinyin) {
        runs.push(new TextRun({
          text: item.character,
          size: options.characterFontSize * 2,
          font: 'Microsoft YaHei',
          color: options.characterColor || '000000'
        }));
        runs.push(new TextRun({
          text: `(${item.pinyin})`,
          size: options.pinyinFontSize * 2,
          font: 'Arial',
          color: options.pinyinColor || '000000',
          superscript: true
        }));
      } else {
        runs.push(new TextRun({
          text: item.character,
          size: options.characterFontSize * 2,
          font: 'Arial',
          color: options.characterColor || '000000'
        }));
      }
    }
    
    return new Paragraph({
      children: runs,
      spacing: {
        line: options.lineSpacing * 240
      }
    });
  }

  getCharacterClass(character) {
    if (!character || typeof character !== 'string') {
      return 'other';
    }
    
    const code = character.charCodeAt(0);
    
    // CJK Unified Ideographs
    if (code >= 0x4E00 && code <= 0x9FFF) return 'chinese';
    
    // CJK Unified Ideographs Extension A
    if (code >= 0x3400 && code <= 0x4DBF) return 'chinese';
    
    // Fullwidth ASCII variants
    if (code >= 0xFF01 && code <= 0xFF5E) return 'fullwidth';
    
    // Halfwidth and Fullwidth Forms
    if (code >= 0xFF00 && code <= 0xFFEF) return 'fullwidth';
    
    // ASCII
    if (code >= 0x0020 && code <= 0x007E) return 'ascii';
    
    // Other characters
    return 'other';
  }

  getCharacterAlignment(charClass) {
    switch (charClass) {
      case 'chinese':
      case 'fullwidth':
        return {
          alignment: AlignmentType.CENTER,
          verticalAlign: VerticalAlign.CENTER
        };
      case 'ascii':
        return {
          alignment: AlignmentType.LEFT,
          verticalAlign: VerticalAlign.BOTTOM
        };
      default:
        return {
          alignment: AlignmentType.CENTER,
          verticalAlign: VerticalAlign.CENTER
        };
    }
  }

  // 添加 writeDocx 方法以兼容服务器调用
  writeDocx(processedData, outputPath, options = {}) {
    if (logger && logger.info) {
      logger.info('调用 writeDocx 方法');
    }
    return this.write(processedData, { ...options, outputPath });
  }
}

module.exports = DocxWriter;