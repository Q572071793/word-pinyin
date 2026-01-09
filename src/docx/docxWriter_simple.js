const { Document, Paragraph, TextRun, Table, TableRow, TableCell, AlignmentType, WidthType, VerticalAlign, BorderStyle, Packer } = require('docx');
const fs = require('fs').promises;
const path = require('path');

class DocxWriter {
  constructor() {
    this.name = 'DocxWriter';
  }

  async write(processedData, options = {}) {
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
        layoutStyle: 'table',
        charsPerLine: 12,
        ...options
      };

      // 选择布局方式
      let content;
      
      if (mergedOptions.layoutStyle === 'inline') {
        content = this.createInlinePinyinParagraph(processedData, mergedOptions);
      } else if (mergedOptions.layoutStyle === 'bracket') {
        content = this.createBracketPinyinParagraph(processedData, mergedOptions);
      } else {
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
      const outputDir = path.dirname(options.outputPath);
      await fs.mkdir(outputDir, { recursive: true });

      // 使用Packer生成DOCX文件
      const buffer = await Packer.toBuffer(doc);
      
      // 写入文件
      await fs.writeFile(options.outputPath, buffer);
      
      return doc;

    } catch (error) {
      console.error('DOCX生成失败:', error);
      throw error;
    }
  }

  createTablePinyinParagraph(processedItems, options) {
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
                  size: options.pinyinFontSize * 2,
                  font: options.fontFamily,
                  bold: false
                })
              ],
              alignment: AlignmentType.CENTER
            })
          ],
          verticalAlign: VerticalAlign.CENTER,
          borders: options.boxBorder ? {
            top: { style: BorderStyle.SINGLE, size: 1 },
            bottom: { style: BorderStyle.SINGLE, size: 1 },
            left: { style: BorderStyle.SINGLE, size: 1 },
            right: { style: BorderStyle.SINGLE, size: 1 }
          } : {}
        }));
        
        // Add character cell
        charCells.push(new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: item.character,
                  size: options.characterFontSize * 2,
                  font: options.fontFamily,
                  bold: true
                })
              ],
              alignment: AlignmentType.CENTER
            })
          ],
          verticalAlign: VerticalAlign.CENTER,
          borders: options.boxBorder ? {
            top: { style: BorderStyle.SINGLE, size: 1 },
            bottom: { style: BorderStyle.SINGLE, size: 1 },
            left: { style: BorderStyle.SINGLE, size: 1 },
            right: { style: BorderStyle.SINGLE, size: 1 }
          } : {}
        }));
      } else {
        // Non-Chinese character, add empty pinyin cell and character cell
        if (options.includePinyin) {
          pinyinCells.push(new TableCell({
            children: [new Paragraph({ children: [] })],
            borders: options.boxBorder ? {
              top: { style: BorderStyle.SINGLE, size: 1 },
              bottom: { style: BorderStyle.SINGLE, size: 1 },
              left: { style: BorderStyle.SINGLE, size: 1 },
              right: { style: BorderStyle.SINGLE, size: 1 }
            } : {}
          }));
        }
        
        charCells.push(new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: item.character,
                  size: options.characterFontSize * 2,
                  font: options.fontFamily
                })
              ],
              alignment: AlignmentType.CENTER
            })
          ],
          borders: options.boxBorder ? {
            top: { style: BorderStyle.SINGLE, size: 1 },
            bottom: { style: BorderStyle.SINGLE, size: 1 },
            left: { style: BorderStyle.SINGLE, size: 1 },
            right: { style: BorderStyle.SINGLE, size: 1 }
          } : {}
        }));
      }
    }
    
    if (options.includePinyin && pinyinCells.length > 0) {
      tableRows.push(new TableRow({ children: pinyinCells }));
    }
    if (charCells.length > 0) {
      tableRows.push(new TableRow({ children: charCells }));
    }
    
    return new Table({
      rows: tableRows,
      width: {
        size: 100,
        type: WidthType.PERCENTAGE
      },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1 },
        bottom: { style: BorderStyle.SINGLE, size: 1 },
        left: { style: BorderStyle.SINGLE, size: 1 },
        right: { style: BorderStyle.SINGLE, size: 1 }
      }
    });
  }

  createInlinePinyinParagraph(processedItems, options) {
    const paragraphs = [];
    let currentText = '';
    
    for (const item of processedItems) {
      if (item.isChinese && item.hasPinyin && options.includePinyin) {
        if (currentText) {
          paragraphs.push(new Paragraph({
            children: [
              new TextRun({
                text: currentText,
                size: options.characterFontSize * 2,
                font: options.fontFamily
              })
            ]
          }));
          currentText = '';
        }
        
        // Add pinyin
        paragraphs.push(new Paragraph({
          children: [
            new TextRun({
              text: item.pinyin,
              size: options.pinyinFontSize * 2,
              font: options.fontFamily,
              bold: false
            })
          ],
          alignment: AlignmentType.CENTER
        }));
        
        // Add character
        paragraphs.push(new Paragraph({
          children: [
            new TextRun({
              text: item.character,
              size: options.characterFontSize * 2,
              font: options.fontFamily,
              bold: true
            })
          ],
          alignment: AlignmentType.CENTER
        }));
      } else {
        currentText += item.character;
      }
    }
    
    if (currentText) {
      paragraphs.push(new Paragraph({
        children: [
          new TextRun({
            text: currentText,
            size: options.characterFontSize * 2,
            font: options.fontFamily
          })
        ]
      }));
    }
    
    return paragraphs;
  }

  createBracketPinyinParagraph(processedItems, options) {
    const paragraphs = [];
    let currentLine = '';
    
    for (const item of processedItems) {
      if (item.isChinese && item.hasPinyin && options.includePinyin) {
        currentLine += `${item.character}(${item.pinyin}) `;
      } else {
        currentLine += item.character;
      }
      
      if (item.character === '\n' || currentLine.length > options.charsPerLine * 2) {
        paragraphs.push(new Paragraph({
          children: [
            new TextRun({
              text: currentLine.trim(),
              size: options.characterFontSize * 2,
              font: options.fontFamily
            })
          ]
        }));
        currentLine = '';
      }
    }
    
    if (currentLine) {
      paragraphs.push(new Paragraph({
        children: [
          new TextRun({
            text: currentLine.trim(),
            size: options.characterFontSize * 2,
            font: options.fontFamily
          })
        ]
      }));
    }
    
    return paragraphs;
  }
}

module.exports = DocxWriter;