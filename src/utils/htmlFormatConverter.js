/**
 * HTML格式转换器 - 将HTML格式转换为PDF/DOCX可用的格式
 */
class HtmlFormatConverter {
    constructor() {
        this.name = 'HtmlFormatConverter';
    }

    /**
     * 将HTML格式的数据转换为PDF格式
     * @param {string} htmlData - HTML格式的数据
     * @returns {Array} 转换后的数据
     */
    convertToPdfFormat(htmlData) {
        if (!htmlData || typeof htmlData !== 'string') {
            return [];
        }

        const result = [];
        const lines = htmlData.split('<div class="pinyin-line"');
        
        for (const lineHtml of lines) {
            if (!lineHtml.trim()) continue;
            
            const lineData = {
                type: 'line',
                content: []
            };

            // 提取拼音项
            const itemRegex = /<div class="pinyin-item[^>]*>(.*?)<\/div>\s*<\/div>/g;
            let itemMatch;
            
            while ((itemMatch = itemRegex.exec(lineHtml)) !== null) {
                const itemHtml = itemMatch[1];
                
                // 提取拼音
                const pinyinMatch = itemHtml.match(/<div class="pinyin-text"[^>]*>(.*?)<\/div>/);
                const pinyin = pinyinMatch ? pinyinMatch[1].trim() : '';
                
                // 提取汉字
                const charMatch = itemHtml.match(/<div class="character-text"[^>]*>(.*?)<\/div>/);
                const character = charMatch ? charMatch[1].trim() : '';
                
                if (pinyin && character) {
                    lineData.content.push({
                        pinyin: pinyin,
                        character: character,
                        isChinese: true,
                        hasPinyin: true
                    });
                }
            }
            
            if (lineData.content.length > 0) {
                result.push(lineData);
            }
        }
        
        return result;
    }

    /**
     * 将HTML格式的数据转换为DOCX格式
     * @param {string} htmlData - HTML格式的数据
     * @returns {Array} 转换后的数据
     */
    convertToDocxFormat(htmlData) {
        const pdfFormat = this.convertToPdfFormat(htmlData);
        const result = [];
        
        for (const line of pdfFormat) {
            if (line.content && Array.isArray(line.content)) {
                result.push(...line.content);
            }
        }
        
        return result;
    }
}

module.exports = HtmlFormatConverter;