# 中文拼音生成器 - 技术文档

## 1. 系统架构

### 1.1 整体架构
中文拼音生成器采用前后端分离的架构设计：

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   前端 (UI)     │    │   后端 (API)    │    │   核心引擎      │
│                 │◄──►│                 │◄──►│                 │
│ - HTML/CSS/JS   │    │ - Express.js    │    │ - 拼音转换      │
│ - 实时预览      │    │ - 路由处理      │    │ - 文本处理      │
│ - 文件上传      │    │ - 数据验证      │    │ - DOCX生成      │
│ - 下载处理      │    │ - 错误处理      │    │ - 布局生成      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 1.2 技术栈

#### 前端技术
- **HTML5/CSS3**: 页面结构和样式
- **原生JavaScript**: 交互逻辑和DOM操作
- **Fetch API**: 与后端通信
- **Base64**: 文件编码处理

#### 后端技术
- **Node.js**: 服务器运行环境
- **Express.js**: Web应用框架
- **Multer**: 文件上传处理
- **docx.js**: DOCX文档生成

#### 核心库
- **pinyin-pro**: 中文转拼音（实际项目中使用）
- **jszip**: ZIP文件处理（DOCX内部格式）

## 2. 模块设计

### 2.1 前端模块

#### 2.1.1 UI模块 (src/ui/)
```
src/ui/
├── index.html          # 主页面
├── app.js             # 前端主逻辑
├── styles.css         # 样式文件
└── components/        # UI组件
```

**核心功能**:
- 文本输入和验证
- 实时转换（防抖处理）
- 文件上传处理
- Base64文件下载
- 错误处理和用户反馈

#### 2.1.2 关键代码结构
```javascript
class PinyinApp {
  constructor() {
    this.currentProcessedData = null;  // 存储处理后的数据
    this.realTimeTimeout = null;        // 防抖定时器
    this.currentCharsPerLine = 12;      // 当前每行字数
  }
  
  // 主要方法
  async convertText() { /* 文本转换 */ }
  async convertTextRealTime() { /* 实时转换 */ }
  async downloadDocx() { /* DOCX下载 */ }
  handleRealTimeConversion() { /* 防抖处理 */ }
}
```

### 2.2 后端模块

#### 2.2.1 主应用模块 (src/app.js)
```javascript
class PinyinServer {
  constructor() {
    this.app = express();
    this.textProcessor = new TextProcessor();
    this.pinyinConverter = new PinyinConverter();
    this.docxWriter = new DocxWriter();
    this.layoutGenerator = new LayoutGenerator();
  }
  
  // 主要API端点
  async generatePinyin(req, res) { /* 拼音转换 */ }
  async generateDocxPinyin(req, res) { /* DOCX生成 */ }
  async uploadDocxFile(req, res) { /* DOCX上传处理 */ }
}
```

#### 2.2.2 核心处理模块 (src/core/)
```
src/core/
├── textProcessor.js      # 文本处理
├── pinyinConverter.js    # 拼音转换
├── layoutGenerator.js    # HTML布局生成
└── docxWriter.js         # DOCX文档生成
```

## 3. 数据流设计

### 3.1 文本转换流程
```
用户输入 → 文本验证 → 字符分割 → 拼音转换 → 结构化数据 → HTML预览
```

### 3.2 DOCX生成流程
```
用户请求 → 数据验证 → 结构化处理 → 表格生成 → DOCX打包 → Base64编码 → 下载
```

### 3.3 文件上传流程
```
文件上传 → 格式验证 → DOCX解析 → 文本提取 → 拼音转换 → 结果返回
```

## 4. API接口设计

### 4.1 拼音转换接口

#### POST /api/pinyin
**功能**: 将中文文本转换为拼音标注

**请求参数**:
```json
{
  "text": "中文文本",
  "format": "html",
  "options": {
    "maxLineLength": 20
  }
}
```

**响应数据**:
```json
{
  "success": true,
  "data": "<div>HTML内容</div>",
  "structuredData": [[...]],
  "format": "html"
}
```

### 4.2 DOCX生成接口

#### POST /api/pinyin/docx
**功能**: 生成带拼音标注的DOCX文档

**请求参数**:
```json
{
  "text": "中文文本",
  "processedData": [[...]]
}
```

**响应数据**:
```json
{
  "success": true,
  "base64Data": "base64编码的DOCX文件",
  "fileName": "pinyin_output.docx",
  "fileSize": 7948
}
```

### 4.3 DOCX上传接口

#### POST /api/pinyin/docx/upload
**功能**: 上传DOCX文件并提取文本

**请求格式**: multipart/form-data

**响应数据**:
```json
{
  "success": true,
  "data": "<div>HTML内容</div>",
  "originalText": "提取的原始文本"
}
```

## 5. 数据结构设计

### 5.1 字符对象结构
```javascript
{
  "character": "中",        // 字符
  "pinyin": "zhōng",      // 拼音
  "isChinese": true,      // 是否为中文字符
  "hasPinyin": true,      // 是否有拼音
  "id": 1                 // 唯一标识
}
```

### 5.2 结构化数据格式
```javascript
[
  [  // 第一行
    {"character": "中", "pinyin": "zhōng", "isChinese": true, "hasPinyin": true},
    {"character": "文", "pinyin": "wén", "isChinese": true, "hasPinyin": true}
  ],
  [  // 第二行
    {"character": "拼", "pinyin": "pīn", "isChinese": true, "hasPinyin": true},
    {"character": "音", "pinyin": "yīn", "isChinese": true, "hasPinyin": true}
  ]
]
```

### 5.3 DOCX配置选项
```javascript
{
  "includePinyin": true,      // 包含拼音
  "pinyinFontSize": 12,       // 拼音字体大小
  "characterFontSize": 16,    // 字符字体大小
  "fontFamily": "SimSun",     // 字体
  "pinyinColor": "000000",    // 拼音颜色
  "characterColor": "000000", // 字符颜色
  "boxBorder": false,         // 边框
  "tableWidth": 100           // 表格宽度百分比
}
```

## 6. 核心算法设计

### 6.1 文本处理算法
```javascript
processText(text) {
  const characters = text.split('');
  const result = [];
  
  for (let i = 0; i < characters.length; i++) {
    const char = characters[i];
    const isChinese = this.isChineseCharacter(char);
    const pinyin = isChinese ? this.convertToPinyin(char) : '';
    
    result.push({
      character: char,
      pinyin: pinyin,
      isChinese: isChinese,
      hasPinyin: !!pinyin,
      id: i + 1
    });
  }
  
  return result;
}
```

### 6.2 行分割算法
```javascript
splitTextIntoLines(processedItems, maxLineLength) {
  const lines = [];
  let currentLine = [];
  let currentLength = 0;
  
  for (const item of processedItems) {
    const charLength = item.isChinese ? 2 : 1;  // 中文算2个单位
    
    if (currentLength + charLength > maxLineLength && currentLine.length > 0) {
      lines.push(currentLine);
      currentLine = [];
      currentLength = 0;
    }
    
    currentLine.push(item);
    currentLength += charLength;
  }
  
  if (currentLine.length > 0) {
    lines.push(currentLine);
  }
  
  return lines;
}
```

### 6.3 DOCX表格生成算法
```javascript
createTablePinyinParagraph(processedItems, options) {
  // 创建两行表格：第一行拼音，第二行字符
  const pinyinCells = [];
  const charCells = [];
  
  for (const item of processedItems) {
    if (item.isChinese && item.hasPinyin) {
      // 添加拼音单元格
      pinyinCells.push(new TableCell({
        children: [new Paragraph({
          children: [new TextRun({
            text: item.pinyin,
            size: options.pinyinFontSize * 2,
            font: options.fontFamily,
            bold: true
          })],
          alignment: AlignmentType.CENTER
        })]
      }));
      
      // 添加字符单元格
      charCells.push(new TableCell({
        children: [new Paragraph({
          children: [new TextRun({
            text: item.character,
            size: options.characterFontSize * 2,
            font: options.fontFamily
          })],
          alignment: AlignmentType.CENTER
        })]
      }));
    }
  }
  
  // 创建表格并包装在段落中
  const table = new Table({
    rows: [
      new TableRow({ children: pinyinCells }),
      new TableRow({ children: charCells })
    ]
  });
  
  return new Paragraph({ children: [table] });
}
```

## 7. 错误处理设计

### 7.1 前端错误处理
```javascript
try {
  const response = await fetch('/api/pinyin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  
  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.error || '转换失败');
  }
  
  return result;
} catch (error) {
  console.error('转换错误:', error);
  alert('转换过程中出现错误: ' + error.message);
  throw error;
}
```

### 7.2 后端错误处理
```javascript
async generatePinyin(req, res) {
  try {
    // 业务逻辑处理
    const result = await processText(req.body.text);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.logError(error, '拼音转换失败');
    res.status(500).json({ 
      success: false, 
      error: error.message || '内部服务器错误' 
    });
  }
}
```

## 8. 性能优化

### 8.1 前端优化
- **防抖处理**: 实时转换使用500ms防抖
- **懒加载**: 按需加载资源文件
- **缓存策略**: 浏览器端缓存静态资源

### 8.2 后端优化
- **异步处理**: 所有I/O操作使用异步模式
- **内存管理**: 及时清理临时文件和缓存
- **错误日志**: 详细的性能监控和日志记录

### 8.3 算法优化
- **字符缓存**: 缓存常用字符的拼音转换结果
- **批量处理**: 批量处理文本减少循环开销
- **流式处理**: 大文件使用流式处理减少内存占用

## 9. 安全设计

### 9.1 输入验证
```javascript
validateInput(text) {
  if (!text || typeof text !== 'string') {
    throw new Error('输入文本不能为空');
  }
  
  if (text.length > 10000) {
    throw new Error('文本长度不能超过10000个字符');
  }
  
  // XSS防护
  if (text.includes('<script>') || text.includes('javascript:')) {
    throw new Error('输入包含非法字符');
  }
  
  return text.trim();
}
```

### 9.2 文件安全
```javascript
validateUploadFile(file) {
  const allowedTypes = ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (!allowedTypes.includes(file.mimetype)) {
    throw new Error('只允许上传DOCX文件');
  }
  
  if (file.size > maxSize) {
    throw new Error('文件大小不能超过10MB');
  }
  
  return true;
}
```

## 10. 部署架构

### 10.1 环境配置
```javascript
// 环境变量配置
const config = {
  development: {
    port: 3004,
    logLevel: 'debug',
    cors: true
  },
  production: {
    port: process.env.PORT || 3004,
    logLevel: 'info',
    cors: false
  }
};
```

### 10.2 Docker配置
```dockerfile
FROM node:16-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 3004

CMD ["node", "src/app.js"]
```

### 10.3 监控和日志
```javascript
const logger = {
  info: (message, data) => console.log(`[INFO] ${message}`, data),
  warn: (message, data) => console.warn(`[WARN] ${message}`, data),
  error: (message, error) => console.error(`[ERROR] ${message}`, error),
  debug: (message, data) => console.debug(`[DEBUG] ${message}`, data)
};
```

---

**文档版本**: v1.0  
**创建日期**: 2025年1月6日  
**最后更新**: 2025年1月6日