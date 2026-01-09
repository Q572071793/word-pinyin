const fs = require('fs');
const path = require('path');

console.log('🔧 开始设置项目...');

// 创建必要的目录结构
function createProjectStructure() {
  const directories = [
    'temp',
    'logs', 
    'output',
    'src/utils',
    'src/docx',
    'src/pdf',
    'src/ui',
    'scripts'
  ];

  directories.forEach(dir => {
    const dirPath = path.join(__dirname, '..', dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`  已创建目录: ${dir}`);
    }
  });
}

// 创建示例配置文件
function createExampleConfig() {
  const configPath = path.join(__dirname, '..', 'config.example.json');
  if (!fs.existsSync(configPath)) {
    const config = {
      "server": {
        "port": 80,
        "fallbackPorts": [8080, 3000, 3001],
        "autoOpenBrowser": true
      },
      "pdf": {
        "defaultFontSize": 12,
        "defaultFontFamily": "Microsoft YaHei",
        "defaultLineHeight": 1.5,
        "defaultMargin": 50
      },
      "docx": {
        "defaultFontSize": 12,
        "defaultFontFamily": "Microsoft YaHei",
        "defaultLineHeight": 1.5
      },
      "pinyin": {
        "defaultToneType": "mark",
        "defaultCaseType": "lower",
        "defaultVcharType": "v",
        "defaultMaxLineLength": 20
      }
    };

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log('  已创建示例配置文件: config.example.json');
  }
}

// 验证依赖项
function checkDependencies() {
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  console.log('  项目依赖项:');
  Object.keys(packageJson.dependencies).forEach(dep => {
    console.log(`    - ${dep}: ${packageJson.dependencies[dep]}`);
  });
}

try {
  createProjectStructure();
  createExampleConfig();
  checkDependencies();
  console.log('✅ 项目设置完成！');
  console.log('');
  console.log('下一步操作:');
  console.log('1. 运行 npm install 安装依赖');
  console.log('2. 运行 npm start 启动服务');
  console.log('3. 运行 npm test 测试功能');
} catch (error) {
  console.error('❌ 设置过程中出现错误:', error.message);
}