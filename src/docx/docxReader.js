const JSZip = require('jszip');
const fs = require('fs');
const logger = require('../utils/logger');

class DocxReader {
  constructor() {
    logger.debug('DocxReader初始化完成');
  }

  async readDocx(filePath) {
    try {
      const buffer = fs.readFileSync(filePath);
      return await this.readDocxFromBuffer(buffer);
    } catch (error) {
      throw new Error(`Error reading DOCX file: ${error.message}`);
    }
  }

  async readDocxFromBuffer(buffer) {
    try {
      const zip = new JSZip();
      const content = await zip.loadAsync(buffer);
      
      // Get the document XML
      const docXml = await content.file('word/document.xml').async('text');
      
      // Parse the XML to extract text
      const paragraphs = this.parseDocumentXml(docXml);
      
      return { paragraphs };
    } catch (error) {
      throw new Error(`Error parsing DOCX file: ${error.message}`);
    }
  }

  parseDocumentXml(xmlContent) {
    try {
      // Extract paragraphs from the document XML
      const paragraphs = [];
      
      // Find all paragraph elements
      const paraRegex = /<w:p(?:\s[^>]*)?>(.*?)<\/w:p>/gs;
      const paraMatches = [...xmlContent.matchAll(paraRegex)];
      
      for (const paraMatch of paraMatches) {
        const paraContent = paraMatch[1];
        const text = this.extractTextFromParagraph(paraContent);
        
        if (text.trim()) {
          paragraphs.push({ text: text.trim() });
        }
      }
      
      // If no paragraphs found, try simple text extraction
      if (paragraphs.length === 0) {
        const simpleText = this.extractTextFromXml(xmlContent);
        if (simpleText.trim()) {
          paragraphs.push({ text: simpleText.trim() });
        }
      }
      
      return paragraphs;
    } catch (error) {
      throw new Error(`Error parsing document XML: ${error.message}`);
    }
  }

  extractTextFromParagraph(paraContent) {
    // Extract text from paragraph content
    const textRuns = [];
    
    // Find all text elements within the paragraph
    const textRegex = /<w:t(?:\s[^>]*)?>(.*?)<\/w:t>/gs;
    const textMatches = [...paraContent.matchAll(textRegex)];
    
    for (const textMatch of textMatches) {
      textRuns.push(this.decodeXmlEntities(textMatch[1]));
    }
    
    return textRuns.join('');
  }

  extractTextFromXml(xmlContent) {
    // A real implementation would use an XML parser to extract text properly
    // This is a simplified version that just extracts content between tags
    const textRegex = /<w:t[^>]*>(.*?)<\/w:t>/g;
    const matches = [...xmlContent.matchAll(textRegex)];
    return matches.map(match => this.decodeXmlEntities(match[1])).join(' ');
  }

  decodeXmlEntities(text) {
    return text
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#x9;/g, '\t')
      .replace(/&#xA;/g, '\n')
      .replace(/&#xD;/g, '\r');
  }
}

module.exports = DocxReader;