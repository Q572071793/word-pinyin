# 贡献指南

感谢您对中文文本拼音标注工具项目的关注！我们欢迎各种形式的贡献。

## 🚀 如何开始

### 1. Fork 项目
1. 点击右上角的 "Fork" 按钮
2. 将项目克隆到您的本地环境

```bash
git clone https://github.com/您的用户名/word-pinyin.git
cd word-pinyin
```

### 2. 安装依赖
```bash
npm install
```

### 3. 启动开发环境
```bash
# 使用统一启动器
node start.js development

# 或使用npm脚本
npm run dev
```

## 📝 贡献类型

### 代码贡献
- 🐛 **Bug修复**: 修复发现的错误
- ✨ **新功能**: 添加新功能或改进现有功能
- 🎨 **代码优化**: 改进代码质量和性能
- 📚 **文档**: 改进文档和注释

### 非代码贡献
- 🐛 **问题报告**: 报告发现的Bug
- 💡 **功能建议**: 提出新功能想法
- 📖 **文档翻译**: 帮助翻译文档
- 🧪 **测试**: 帮助测试新功能

## 🔄 开发流程

### 1. 创建分支
```bash
git checkout -b feature/您的功能名称
# 或
git checkout -b fix/bug描述
```

### 2. 进行更改
- 编写代码
- 添加测试（如果适用）
- 更新文档

### 3. 测试您的更改
```bash
# 运行测试
npm test

# 启动开发服务器测试
node start.js development
```

### 4. 提交更改
```bash
git add .
git commit -m "描述您的更改"
```

### 5. 推送到您的Fork
```bash
git push origin feature/您的功能名称
```

### 6. 创建Pull Request
1. 在GitHub上创建Pull Request
2. 描述您的更改
3. 等待代码审查

## 📋 代码规范

### 代码风格
- 使用ES6+语法
- 遵循现有的代码缩进（2个空格）
- 使用有意义的变量名和函数名
- 添加必要的注释

### 文件命名
- 使用小写字母和连字符
- 例如：`port-manager.js`，`browser-launcher.js`

### 提交信息
提交信息应该清晰描述更改内容：
```
feat: 添加PDF导出功能
fix: 修复端口检测逻辑
docs: 更新README文档
style: 改进代码格式
refactor: 重构端口管理器
```

## 🧪 测试指南

### 运行测试
```bash
# 运行所有测试
npm test

# 运行特定测试
node test_comprehensive.js
```

### 添加测试
- 为新功能添加测试用例
- 确保测试覆盖主要功能
- 测试应该独立且可重复

## 📚 文档规范

### README更新
- 保持README.md的最新状态
- 添加新功能的说明
- 更新使用示例

### 代码注释
- 为复杂逻辑添加注释
- 使用JSDoc格式为函数添加文档

## 🐛 报告Bug

### Bug报告模板
```markdown
**问题描述**
清晰描述遇到的问题

**重现步骤**
1. 步骤1
2. 步骤2
3. 步骤3

**期望行为**
描述期望的行为

**实际行为**
描述实际发生的行为

**环境信息**
- 操作系统: [例如 Windows 10]
- Node.js版本: [例如 16.0.0]
- 浏览器: [例如 Chrome 96]
```

## 💡 功能建议

### 建议模板
```markdown
**功能描述**
描述您希望添加的功能

**使用场景**
描述这个功能的使用场景

**实现建议**
如果有的话，提供实现建议

**替代方案**
描述其他可能的解决方案
```

## 🎯 开发重点

### 当前优先级
1. **性能优化**: 提高处理速度
2. **用户体验**: 改进界面设计
3. **功能扩展**: 支持更多导出格式
4. **国际化**: 支持多语言界面

### 未来规划
- 支持更多拼音标注样式
- 添加批量文件处理
- 支持云端处理
- 移动端应用

## 🤝 社区准则

### 行为准则
- 保持友善和尊重
- 欢迎新贡献者
- 建设性反馈
- 保护隐私和安全

### 沟通方式
- 使用清晰的沟通方式
- 及时回复问题和评论
- 帮助其他贡献者

## 📞 获得帮助

### 联系方式
- **Issues**: [GitHub Issues](https://github.com/trae-ai/word-pinyin/issues)
- **Discussions**: [GitHub Discussions](https://github.com/trae-ai/word-pinyin/discussions)
- **Wiki**: [项目Wiki](https://github.com/trae-ai/word-pinyin/wiki)

### 常见问题
查看项目的 [FAQ](docs/faq.md) 获取常见问题的答案。

## 🏆 贡献者认可

所有贡献者将在项目的贡献者列表中得到认可。感谢您对开源社区的贡献！

---

**再次感谢您的贡献！让我们一起构建更好的中文拼音标注工具。** 🎉