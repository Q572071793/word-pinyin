const { Document, Paragraph, TextRun, Table, TableRow, TableCell, AlignmentType, WidthType, VerticalAlign, BorderStyle, Packer } = require('docx');
const fs = require('fs').promises;

class DocxWriter {
  constructor() {
    this.name = 'DocxWriter';
    // 避免循环依赖，不在构造函数中使用logger
  }

  async write(processedData, options = {}) {
    const { logger } = require('../utils/logger');
    logger.info('开始生成DOCX文档', { 
      outputPath: options.outputPath,
      contentType: typeof processedData 
    });

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
      const { logger } = require('../utils/logger');
      logger.info('选择布局方式', {});
      let content;
      
      if (mergedOptions.layoutStyle === 'inline') {
        logger.info('使用内联布局');
        content = this.createInlinePinyinParagraph(processedData, mergedOptions);
      } else if (mergedOptions.layoutStyle === 'bracket') {
        logger.info('使用括号布局');
        content = this.createBracketPinyinParagraph(processedData, mergedOptions);
      } else {
        logger.info('使用表格布局（默认）');
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

      // 确保输出目录存在
      const path = require('path');
      const outputDir = path.dirname(options.outputPath);
      await fs.mkdir(outputDir, { recursive: true });

      // 使用Packer生成DOCX文件
      logger.info('开始打包DOCX文件', { outputPath: options.outputPath });
      const buffer = await Packer.toBuffer(doc);
      
      // 写入文件
      await fs.writeFile(options.outputPath, buffer);
      
      logger.info('DOCX文档生成完成', { outputPath: options.outputPath, fileSize: buffer.length });
      return doc;

    } catch (error) {
      logger.error('DOCX生成失败', error);
      throw error;
    }
  }

  createTablePinyinParagraph(processedItems, options) {
    const { logger } = require('../utils/logger');
    logger.info('createTablePinyinParagraph开始', { 
      processedItemsLength: processedItems.length,
      options: JSON.stringify(options)
    });
    
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
        const charClass = this.getCharacterClass(item.character);
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
                  text: item.character,
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
    
    logger.info('创建拼音表格段落', { chineseCount, totalItems: processedItems.length, pinyinCellsLength: pinyinCells.length, charCellsLength: charCells.length });
    
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
    
    logger.info('表格创建完成', { tableCreated: true });
    
    // Return the table directly - tables should not be wrapped in paragraphs
    return table;
  }

  createInlinePinyinParagraph(processedItems, options) {
    const { logger } = require('../utils/logger');
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
    const { logger } = require('../utils/logger');
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
}

module.exports = DocxWriter;