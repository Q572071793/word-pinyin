const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

class PDFWriter {
    constructor(options = {}) {
        this.options = {
            fontSize: options.fontSize || 12,
            fontFamily: options.fontFamily || 'Microsoft YaHei',
            lineHeight: options.lineHeight || 1.5,
            margin: options.margin || 50,
            pageSize: options.pageSize || 'A4',
            orientation: options.orientation || 'portrait',
            ...options
        };
        
        // 设置中文字体路径
        this.fontPaths = {
            'Microsoft YaHei': path.join(__dirname, '../../fonts/msyh.ttf'),
            'SimSun': path.join(__dirname, '../../fonts/simsun.ttc'),
            'Arial': path.join(__dirname, '../../fonts/arial.ttf'),
            'Times New Roman': path.join(__dirname, '../../fonts/times.ttf')
        };
    }

    /**
     * 将处理后的数据写入PDF文件
     * @param {Array} processedData - 处理后的拼音数据
     * @param {Object} options - 选项
     * @returns {Promise<string>} PDF文件路径
     */
    async write(processedData, options = {}) {
        const outputPath = options.outputPath || path.join(process.cwd(), `temp/pinyin_${Date.now()}.pdf`);
        
        if (logger && logger.info) {
            logger.info('开始生成PDF文档', { 
                outputPath,
                dataLength: processedData.length,
                options: this.options 
            });
        }

        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({
                    size: this.options.pageSize,
                    margin: this.options.margin,
                    layout: this.options.orientation === 'landscape' ? 'landscape' : 'portrait'
                });

                // 创建写入流
                const stream = fs.createWriteStream(outputPath);
                doc.pipe(stream);

                // 设置字体
                this.setupFonts(doc);

                // 生成PDF内容
                this.generateContent(doc, processedData);

                // 完成文档
                doc.end();

                stream.on('finish', () => {
                    if (logger && logger.info) {
                        logger.info('PDF文档生成完成', { outputPath });
                    }
                    resolve(outputPath);
                });

                stream.on('error', (error) => {
                    if (logger && logger.error) {
                        logger.error('PDF文件写入错误', { error: error.message });
                    }
                    reject(error);
                });

            } catch (error) {
                if (logger && logger.error) {
                    logger.error('PDF生成错误', { error: error.message });
                }
                reject(error);
            }
        });
    }

    /**
     * 设置字体
     */
    setupFonts(doc) {
        try {
            // 尝试注册中文字体
            if (fs.existsSync(this.fontPaths['Microsoft YaHei'])) {
                doc.registerFont('chinese', this.fontPaths['Microsoft YaHei']);
                doc.font('chinese');
            } else if (fs.existsSync(this.fontPaths['SimSun'])) {
                doc.registerFont('chinese', this.fontPaths['SimSun']);
                doc.font('chinese');
            } else {
                // 使用系统默认字体
                doc.font('Helvetica');
            }
        } catch (error) {
            if (logger && logger.warn) {
                logger.warn('字体设置失败，使用默认字体', { error: error.message });
            }
            doc.font('Helvetica');
        }
    }

    /**
     * 生成PDF内容
     */
    generateContent(doc, processedData) {
        const startY = doc.y;
        let currentY = startY;
        const pageWidth = doc.page.width - 2 * this.options.margin;
        const maxWidth = pageWidth;

        // 调试信息
        if (logger && logger.debug) {
            logger.debug('generateContent接收到的数据', {
                type: typeof processedData,
                isArray: Array.isArray(processedData),
                length: processedData ? processedData.length : 0,
                sample: processedData && processedData.length > 0 ? processedData[0] : null
            });
        }

        if (!Array.isArray(processedData)) {
            throw new Error('processedData必须是数组类型，实际类型: ' + typeof processedData);
        }

        processedData.forEach((line, lineIndex) => {
            if (line.type === 'line' && line.content) {
                this.writeLine(doc, line.content, currentY, maxWidth);
                currentY += this.options.fontSize * this.options.lineHeight * 2; // 为拼音和汉字留空间
                
                // 检查是否需要新页面
                if (currentY > doc.page.height - this.options.margin - 100) {
                    doc.addPage();
                    currentY = this.options.margin;
                }
            }
        });
    }

    /**
     * 写入一行内容（拼音+汉字）
     */
    writeLine(doc, content, y, maxWidth) {
        const itemWidth = maxWidth / content.length;
        let x = this.options.margin;

        content.forEach((item, index) => {
            if (item.pinyin && item.character) {
                // 计算居中对齐的位置
                const centerX = x + itemWidth / 2;
                
                // 写入拼音（小号字体）
                doc.fontSize(this.options.fontSize * 0.8);
                const pinyinWidth = doc.widthOfString(item.pinyin);
                doc.text(item.pinyin, centerX - pinyinWidth / 2, y);
                
                // 写入汉字（正常字体）
                doc.fontSize(this.options.fontSize);
                const charWidth = doc.widthOfString(item.character);
                doc.text(item.character, centerX - charWidth / 2, y + this.options.fontSize);
                
                x += itemWidth;
            }
        });
    }

    /**
     * 生成PDF的Base64数据
     */
    async generateBase64(processedData, options = {}) {
        const tempPath = path.join(process.cwd(), `temp/pinyin_base64_${Date.now()}.pdf`);
        
        try {
            const pdfPath = await this.write(processedData, { ...options, outputPath: tempPath });
            
            // 读取文件并转换为Base64
            const pdfBuffer = fs.readFileSync(pdfPath);
            const base64Data = pdfBuffer.toString('base64');
            
            // 清理临时文件
            if (fs.existsSync(tempPath)) {
                fs.unlinkSync(tempPath);
            }
            
            return base64Data;
        } catch (error) {
            if (logger && logger.error) {
                logger.error('Base64 PDF生成错误', { error: error.message });
            }
            throw error;
        }
    }

    /**
     * 创建表格布局的PDF
     */
    async createTablePDF(processedData, options = {}) {
        const outputPath = options.outputPath || path.join(process.cwd(), `temp/pinyin_table_${Date.now()}.pdf`);
        
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({
                    size: this.options.pageSize,
                    margin: this.options.margin
                });

                const stream = fs.createWriteStream(outputPath);
                doc.pipe(stream);

                this.setupFonts(doc);

                // 表格样式
                const tableOptions = {
                    headers: [],
                    rows: []
                };

                // 构建表格数据
                processedData.forEach(line => {
                    if (line.type === 'line' && line.content) {
                        const row = [];
                        line.content.forEach(item => {
                            if (item.pinyin && item.character) {
                                row.push(`${item.pinyin}\n${item.character}`);
                            }
                        });
                        if (row.length > 0) {
                            tableOptions.rows.push(row);
                        }
                    }
                });

                // 绘制表格
                this.drawTable(doc, tableOptions);

                doc.end();

                stream.on('finish', () => {
                    resolve(outputPath);
                });

                stream.on('error', reject);

            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * 绘制表格
     */
    drawTable(doc, tableData) {
        const startX = doc.x;
        const startY = doc.y;
        const rowHeight = 40;
        const colWidth = 60;
        
        tableData.rows.forEach((row, rowIndex) => {
            let currentX = startX;
            
            row.forEach((cell, colIndex) => {
                // 绘制单元格边框
                doc.rect(currentX, startY + rowIndex * rowHeight, colWidth, rowHeight).stroke();
                
                // 写入内容
                doc.text(cell, currentX + 5, startY + rowIndex * rowHeight + 5, {
                    width: colWidth - 10,
                    align: 'center'
                });
                
                currentX += colWidth;
            });
        });
    }
}

module.exports = PDFWriter;