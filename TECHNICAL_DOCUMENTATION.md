# 技术文档 - 汉字拼音标注工具

## 1. 系统架构

### 1.1 整体架构
本系统采用前后端分离的架构设计：
- **前端**: HTML/CSS/JavaScript 单页应用
- **后端**: Node.js + Express.js RESTful API
- **文件处理**: 独立的DOCX和PDF处理模块
- **工具模块**: 端口管理、浏览器启动、日志记录等

### 1.2 技术栈
- **运行时**: Node.js >= 14.0.0
- **Web框架**: Express.js 4.18.2
- **拼音转换**: pinyin 3.1.0
- **DOCX生成**: docx 8.0.0
- **PDF生成**: pdfkit 0.17.2
- **文件处理**: jszip 3.10.1, multer 2.0.2
- **HTTP客户端**: axios 1.13.2
- **开发工具**: nodemon 3.0.1

## 2. 核心模块设计

### 2.1 拼音转换模块

#### 2.1.1 功能概述
将中文文本转换为带拼音标注的格式化数据，支持多种输出格式。

#### 2.1.2 核心算法
```javascript
// 拼音转换流程
1. 文本预处理（去除多余空格、特殊字符处理）
2. 分词处理（按字符分割）
3. 拼音转换（调用pinyin库）
4. 格式化处理（应用声调、大小写等选项）
5. 布局生成（按行分组、字数控制）
```

#### 2.1.3 配置选项
- **toneType**: 声调标注方式
  - `"mark"`: 使用声调符号 (āáǎà)
  - `"number"`: 使用数字标注 (a1a2a3a4)
- **caseType**: 字母大小写
  - `"lower"`: 小写
  - `"upper"`: 大写
- **vcharType**: ü字符处理
  - `"v"`: 使用v代替
  - `"u"`: 使用u:
  - `"ü"`: 保持原字符
- **maxLineLength**: 每行最大中文字符数

### 2.2 DOCX生成模块

#### 2.2.1 架构设计
采用模块化设计，分为两个实现：
- **docxWriter.js**: 完整功能版本，包含完整日志记录
- **docxWriter_simple.js**: 简化版本，避免循环依赖

#### 2.2.2 表格结构
```
表格布局（每行）：
┌─────────────────────────────────────────┐
│ 拼音行 (Pinyin)                        │
├─────────────────────────────────────────┤
│ 汉字行 (Chinese)                       │
├─────────────────────────────────────────┤
│ 空行 (Spacing)                         │
└─────────────────────────────────────────┘
```

#### 2.2.3 样式配置
- **字体**: Microsoft YaHei, SimSun, 支持自定义
- **字号**: 8-72pt，默认12pt
- **行距**: 单倍、1.5倍、双倍，默认1.5倍
- **对齐**: 左对齐、居中、右对齐
- **边框**: 可选表格边框

### 2.3 PDF生成模块

#### 2.3.1 PDFKit集成
使用PDFKit库生成PDF文档，支持：
- 自定义页面尺寸和边距
- 中文字体嵌入
- 表格布局
- 多页支持

#### 2.3.2 字体处理
```javascript
// 字体配置策略
const fontOptions = {
  'Microsoft YaHei': 'path/to/msyh.ttf',
  'SimSun': 'path/to/simsun.ttf',
  'SimHei': 'path/to/simhei.ttf'
};
```

#### 2.3.3 页面布局
- **页面尺寸**: A4 (210×297mm)
- **默认边距**: 50px
- **表格结构**: 类似DOCX的三行布局
- **分页处理**: 自动分页，保持表格完整性

### 2.4 端口管理模块

#### 2.4.1 端口检测算法
```javascript
// 端口检测流程
async function findAvailablePort(preferredPorts) {
  for (const port of preferredPorts) {
    if (await isPortAvailable(port)) {
      return port; // 返回第一个可用端口
    }
  }
  return findRandomAvailablePort(); // 随机端口作为备选
}
```

#### 2.4.2 端口优先级
1. **端口80**: 首选HTTP端口
2. **端口8080**: 备选HTTP端口
3. **端口3000-3010**: 开发环境端口
4. **随机端口**: 1024-65535范围内的可用端口

### 2.5 浏览器启动模块

#### 2.5.1 跨平台支持
```javascript
// 平台检测与命令选择
const platform = process.platform;
const browserCommands = {
  'win32': ['start', 'chrome', 'firefox', 'edge'],
  'darwin': ['open', 'Google Chrome', 'Firefox', 'Safari'],
  'linux': ['xdg-open', 'google-chrome', 'firefox']
};
```

#### 2.5.2 启动策略
1. 检测默认浏览器
2. 尝试使用系统命令打开
3. 回退到常见浏览器
4. 添加延迟确保服务器就绪

## 3. API设计

### 3.1 RESTful接口规范

#### 3.1.1 拼音转换接口
```http
POST /api/pinyin
Content-Type: application/json

Request:
{
  "text": "中文文本",
  "format": "json|html",
  "options": {
    "toneType": "mark|number",
    "caseType": "lower|upper",
    "vcharType": "v|u|ü",
    "maxLineLength": 20
  }
}

Response:
{
  "success": true,
  "data": [...],
  "format": "json"
}
```

#### 3.1.2 DOCX导出接口
```http
POST /api/pinyin/docx
Content-Type: application/json

Request:
{
  "text": "中文文本",
  "processedData": [...],
  "options": {
    "fontSize": 12,
    "fontFamily": "Microsoft YaHei",
    "lineHeight": 1.5
  }
}

Response:
{
  "success": true,
  "downloadUrl": "/temp/pinyin_xxx.docx",
  "filename": "拼音标注.docx"
}
```

#### 3.1.3 PDF导出接口
```http
POST /api/pinyin/pdf
Content-Type: application/json

Request:
{
  "text": "中文文本",
  "processedData": [...],
  "options": {
    "fontSize": 12,
    "fontFamily": "Microsoft YaHei",
    "lineHeight": 1.5,
    "margin": 50
  }
}

Response:
{
  "success": true,
  "downloadUrl": "/temp/pinyin_xxx.pdf",
  "filename": "拼音标注.pdf"
}
```

### 3.2 错误处理规范

#### 3.2.1 错误响应格式
```json
{
  "success": false,
  "error": "错误描述",
  "code": "ERROR_CODE",
  "details": {
    "field": "具体字段错误信息"
  }
}
```

#### 3.2.2 错误代码定义
- **INVALID_INPUT**: 输入参数无效
- **PROCESSING_ERROR**: 处理过程中出错
- **FILE_SYSTEM_ERROR**: 文件系统错误
- **FONT_NOT_FOUND**: 字体文件未找到
- **PORT_UNAVAILABLE**: 端口不可用

## 4. 数据处理流程

### 4.1 文本处理流程
```
输入文本 → 预处理 → 分词 → 拼音转换 → 格式化 → 布局生成 → 输出
```

### 4.2 文件生成流程
```
请求接收 → 参数验证 → 数据处理 → 文件生成 → 临时存储 → 响应返回
```

### 4.3 错误处理流程
```
错误发生 → 错误分类 → 日志记录 → 错误响应 → 客户端处理
```

## 5. 性能优化

### 5.1 内存管理
- 及时清理临时文件
- 流式处理大文本
- 避免内存泄漏

### 5.2 并发处理
- 异步文件操作
- 非阻塞I/O
- 连接池管理

### 5.3 缓存策略
- 字体文件缓存
- 常用数据缓存
- 临时文件复用

## 6. 安全考虑

### 6.1 输入验证
- 文本长度限制
- 特殊字符过滤
- 文件类型检查

### 6.2 文件安全
- 临时文件隔离
- 文件权限控制
- 定期清理机制

### 6.3 网络安全
- CORS配置
- 请求大小限制
- 错误信息脱敏

## 7. 部署指南

### 7.1 环境要求
- Node.js >= 14.0.0
- 系统字体支持中文
- 足够的磁盘空间

### 7.2 部署步骤
1. 安装Node.js环境
2. 克隆项目代码
3. 安装依赖包
4. 运行设置脚本
5. 启动应用服务

### 7.3 监控配置
- 日志监控
- 性能监控
- 错误告警

## 8. 扩展开发

### 8.1 新格式支持
添加新的导出格式：
1. 创建新的Writer类
2. 实现generate方法
3. 添加API端点
4. 更新前端界面

### 8.2 字体扩展
添加新字体支持：
1. 准备字体文件
2. 更新字体配置
3. 测试显示效果
4. 更新文档说明

### 8.3 插件机制
未来可考虑实现插件机制，支持：
- 自定义处理逻辑
- 第三方格式支持
- 主题样式扩展