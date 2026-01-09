# GitHub 上传指南

## 🚀 快速上传步骤

### 1. 创建GitHub仓库
1. 访问 https://github.com/new
2. 输入仓库名称（建议：`word-pinyin`）
3. 选择公开或私有
4. 不要初始化README（我们已经有现成的）
5. 点击 "Create repository"

### 2. 本地Git配置
在您的项目目录中执行：

```bash
# 初始化Git仓库
git init

# 添加所有文件
git add .

# 提交更改
git commit -m "Initial commit: Chinese Pinyin Annotator v2.0.0

功能特性：
- 智能拼音标注
- DOCX/PDF导出
- 自动端口检测
- 浏览器自动打开
- 跨平台支持
- 多种启动模式"

# 添加远程仓库（替换为您的仓库地址）
git remote add origin https://github.com/您的用户名/word-pinyin.git

# 推送到GitHub
git push -u origin master
```

### 3. 如果GitHub要求使用main分支
```bash
# 重命名分支
git branch -M main

# 推送到main分支
git push -u origin main
```

## 📋 完整的命令行上传流程

我已经为您准备好了完整的上传脚本，您可以直接复制执行：

### Windows PowerShell版本：
```powershell
# 进入项目目录
cd D:\daima\word-pinyin

# 初始化Git仓库
git init

# 添加所有文件
git add .

# 提交更改
git commit -m "Initial commit: Chinese Pinyin Annotator v2.0.0

🎯 功能特性：
• 智能拼音标注 - 自动为中文文本添加拼音
• 多格式导出 - 支持DOCX和PDF格式
• 实时预览 - 即时查看标注效果
• 批量处理 - 支持大文本处理

⚡ 高级特性：
• 自动端口检测 - 智能使用80/8080/随机端口
• 浏览器自动打开 - 启动后自动打开浏览器
• 错误处理 - 完善的错误处理和日志
• 跨平台支持 - Windows/Linux/macOS

🚀 启动方式：
• 一键启动：start.bat / start.sh
• 统一启动器：node start.js
• 开发模式：node start.js development
• 便携模式：node start.js portable"

# 设置远程仓库（请替换为您的仓库地址）
git remote add origin https://github.com/您的用户名/word-pinyin.git

# 推送到GitHub
git push -u origin master
```

### 如果您遇到认证问题：

#### 方法1：使用GitHub CLI
```bash
# 安装GitHub CLI（如果未安装）
winget install GitHub.cli

# 登录GitHub
gh auth login

# 创建并推送仓库
gh repo create word-pinyin --public --source=. --remote=origin --push
```

#### 方法2：使用Personal Access Token
1. 访问 https://github.com/settings/tokens
2. 创建新的Personal Access Token
3. 在推送时使用Token作为密码

```bash
# 推送到GitHub（用户名是您的GitHub用户名，密码是Token）
git push https://github.com/您的用户名/word-pinyin.git
```

## 🎯 上传后的设置建议

### 1. 设置仓库信息
上传后，请在GitHub上：
1. 添加仓库描述
2. 添加标签（topics）如：`chinese`, `pinyin`, `docx`, `pdf`, `nodejs`
3. 设置仓库头像（可选）

### 2. 启用功能
- Issues: 启用问题跟踪
- Discussions: 启用讨论功能
- Wiki: 启用Wiki文档
- Projects: 启用项目管理

### 3. 创建发布版本
```bash
# 创建标签
git tag v2.0.0

# 推送标签
git push origin v2.0.0
```

然后在GitHub上创建Release：
1. 访问 https://github.com/您的用户名/word-pinyin/releases
2. 点击 "Create a new release"
3. 选择标签 `v2.0.0`
4. 填写发布说明
5. 上传构建好的文件（可选）

## 📊 项目亮点展示

在GitHub仓库描述中，建议包含：

```markdown
# 中文文本拼音标注工具

一个功能完整的中文文本拼音标注工具，支持DOCX和PDF导出。

## ✨ 特色功能
- 🎯 智能拼音标注
- 📄 DOCX/PDF导出
- 🚀 自动端口检测
- 🌐 浏览器自动打开
- ⚡ 跨平台支持

## 🚀 一键启动
```bash
# Windows
start.bat

# Linux/macOS
./start.sh
```

## 📖 文档
- [快速开始](README.md#快速开始)
- [API文档](docs/api.md)
- [贡献指南](CONTRIBUTING.md)
```

## 🔧 常见问题解决

### 问题1：推送失败
```bash
# 强制推送（谨慎使用）
git push -f origin master
```

### 问题2：大文件上传失败
```bash
# 检查大文件
git lfs track "*.zip"
git lfs track "node_modules/*"
```

### 问题3：认证失败
- 确保使用正确的GitHub用户名
- 使用Personal Access Token而不是密码
- 检查网络连接

## 🎉 上传完成后的检查清单

- [ ] 代码成功推送到GitHub
- [ ] 仓库描述已更新
- [ ] 标签已添加
- [ ] 发布版本已创建
- [ ] 文档链接正常
- [ ] 启动说明清晰

## 📞 需要帮助？

如果您在上传过程中遇到任何问题：
1. 检查GitHub状态：https://www.githubstatus.com/
2. 查看Git文档：https://docs.github.com/
3. 联系GitHub支持

---

**准备好将您的优秀项目分享给世界了！** 🚀

请按照上述步骤操作，您的中文拼音标注工具很快就会在GitHub上与大家见面！