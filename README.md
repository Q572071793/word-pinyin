# 中文文本拼音标注工具 (Chinese Text Pinyin Annotation Tool)

一个功能完整的中文文本拼音标注工具，支持DOCX和PDF导出，具有现代化的Web界面和一键启动功能。

## 🌟 功能特性

### 核心功能
- **智能拼音标注**: 自动为中文文本添加拼音标注
- **多格式导出**: 支持DOCX和PDF格式导出
- **实时预览**: 即时查看标注效果
- **批量处理**: 支持大文本批量处理

### 高级特性
- **自动端口检测**: 智能检测并使用可用端口（80/8080/随机端口）
- **浏览器自动打开**: 启动后自动打开默认浏览器
- **错误处理**: 完善的错误处理和日志记录
- **跨平台支持**: 支持Windows、Linux、macOS

### 导出功能
- **DOCX导出**: 生成格式化的Word文档，支持表格布局
- **PDF导出**: 生成专业的PDF文档，支持自定义样式
- **自定义样式**: 支持字体、颜色、间距等样式调整

## 🚀 快速开始

### 方法1: 一键启动（推荐）
```bash
# Windows
双击运行：start-simple.bat

# Linux/macOS
./一键启动.sh
```

### 方法2: 手动启动
```bash
# 安装依赖
npm install

# 启动应用
npm start
# 或
node src/app_enhanced.js
```

### 方法3: 开发模式
```bash
# 克隆项目
git clone https://github.com/your-username/word-pinyin.git

# 进入目录
cd word-pinyin

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

## 📋 系统要求

### 最低要求
- **Node.js**: 14.0.0 或更高版本
- **操作系统**: Windows 7+, Linux, macOS 10.12+
- **内存**: 512MB RAM
- **存储**: 100MB 可用空间

### 推荐配置
- **Node.js**: 18.0.0 或更高版本
- **内存**: 1GB RAM
- **浏览器**: Chrome 90+, Firefox 88+, Safari 14+

## 🛠️ 项目结构

```
word-pinyin/
├── src/                    # 源代码
│   ├── core/              # 核心处理逻辑
│   │   ├── pinyinConverter.js    # 拼音转换器
│   │   ├── textProcessor.js      # 文本处理器
│   │   └── layoutGenerator.js    # 布局生成器
│   ├── docx/              # DOCX文档处理
│   │   └── docxWriter_simple.js  # DOCX写入器
│   ├── pdf/               # PDF文档处理
│   │   └── pdfWriter.js   # PDF写入器
│   ├── utils/             # 工具类
│   │   ├── portManager.js # 端口管理器
│   │   ├── browserLauncher.js    # 浏览器启动器
│   │   ├── logger.js      # 日志记录器
│   │   └── htmlFormatConverter.js  # HTML格式转换器
│   └── app_enhanced.js    # 主应用入口
├── ui/                     # 前端界面
│   ├── index.html         # 主页面
│   ├── style.css          # 样式文件
│   ├── app.js             # 前端逻辑
│   └── download_docx_base64.js  # DOCX下载功能
├── docs/                   # 文档
│   ├── requirements.md    # 需求文档
│   ├── technical.md       # 技术文档
│   └── user_manual.md     # 用户手册
├── logs/                   # 日志文件
├── scripts/                # 脚本文件
├── package.json           # 项目配置
├── README.md              # 项目说明
├── start-simple.bat       # Windows启动脚本
├── 一键启动.bat           # Windows中文启动脚本
└── 一键启动.sh            # Linux/macOS启动脚本
```

## 🔧 配置选项

### 基本配置
编辑 `config.json` 文件来自定义应用行为：

```json
{
  "port": 8080,
  "autoOpenBrowser": true,
  "preferredPorts": [80, 8080, 3000, 3001],
  "logLevel": "info",
  "maxTextLength": 10000,
  "exportFormats": ["docx", "pdf"]
}
```

### 高级配置
```json
{
  "pinyin": {
    "style": "TONE",        // TONE, TONE2, TOONE, NORMAL
    "heteronym": false,     // 是否启用多音字
    "segmentation": true    // 是否启用分词
  },
  "export": {
    "docx": {
      "fontSize": 12,
      "fontFamily": "SimSun",
      "lineSpacing": 1.5
    },
    "pdf": {
      "pageSize": "A4",
      "margin": 20,
      "fontSize": 11
    }
  }
}
```

## � API 文档

### 拼音转换 API
```javascript
// 基本用法
const pinyin = require('pinyin');
const result = pinyin('中文文本', {
  style: pinyin.STYLE_TONE,
  heteronym: false
});
// 输出: [["zhōng"], ["wén"], ["wén"], ["běn"]]
```

### 文本处理 API
```javascript
const { processText } = require('./src/core/textProcessor');
const result = processText('中文文本', {
  addPinyin: true,
  format: 'html'
});
```

### 文档导出 API
```javascript
const { exportToDocx } = require('./src/docx/docxWriter_simple');
const { exportToPdf } = require('./src/pdf/pdfWriter');

// 导出DOCX
await exportToDocx(processedText, 'output.docx');

// 导出PDF
await exportToPdf(processedText, 'output.pdf');
```

## 🐛 常见问题

### Q: 启动时提示端口被占用？
A: 应用会自动检测可用端口，无需手动配置。如果需要特定端口，请修改配置文件。

### Q: DOCX文件打开报错？
A: 确保系统中安装了中文字体，推荐使用宋体或微软雅黑。

### Q: PDF导出中文显示异常？
A: 检查系统字体配置，或尝试使用不同的PDF导出选项。

### Q: 浏览器没有自动打开？
A: 检查系统默认浏览器设置，或手动访问显示的URL地址。

### Q: 大文本处理速度慢？
A: 可以调整 `maxTextLength` 参数，或分批处理大文本。

## 🤝 贡献指南

欢迎提交Issue和Pull Request来改进这个项目！

### 开发流程
1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

### 代码规范
- 使用 ESLint 进行代码检查
- 遵循 JavaScript Standard Style
- 添加适当的注释和文档
- 编写单元测试

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [pinyin](https://github.com/hotoo/pinyin) - 拼音转换库
- [docx](https://github.com/dolanmiu/docx) - DOCX文档生成库
- [pdfkit](https://github.com/foliojs/pdfkit) - PDF生成库
- [Express.js](https://expressjs.com/) - Web框架

## 📞 联系方式

- **项目主页**: [GitHub Repository](https://github.com/your-username/word-pinyin)
- **问题反馈**: [Issues](https://github.com/your-username/word-pinyin/issues)
- **邮箱**: your-email@example.com

---

⭐ 如果这个项目对您有帮助，请给我们一个Star！

**Made with ❤️ by [Your Name]**