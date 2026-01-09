#!/usr/bin/env node

/**
 * 中文文本拼音标注工具 - 统一启动器
 * Chinese Text Pinyin Annotation Tool - Universal Launcher
 * 
 * 支持多种启动模式：
 * - 开发模式 (development)
 * - 生产模式 (production) 
 * - 便携模式 (portable)
 * - 调试模式 (debug)
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// 启动模式配置
const MODES = {
  development: {
    name: '开发模式',
    description: '启用热重载和详细日志',
    script: 'nodemon',
    args: ['src/app_enhanced.js'],
    env: { NODE_ENV: 'development', LOG_LEVEL: 'debug' }
  },
  production: {
    name: '生产模式', 
    description: '优化性能和稳定性',
    script: 'node',
    args: ['src/app_enhanced.js'],
    env: { NODE_ENV: 'production', LOG_LEVEL: 'info' }
  },
  portable: {
    name: '便携模式',
    description: '无需安装依赖，使用内置Node.js',
    script: process.platform === 'win32' ? '.\\node\\node.exe' : './node/node',
    args: ['src/app_enhanced.js'],
    env: { NODE_ENV: 'portable', LOG_LEVEL: 'info', PORTABLE_MODE: 'true' }
  },
  debug: {
    name: '调试模式',
    description: '启用详细调试信息',
    script: 'node',
    args: ['--inspect', 'src/app_enhanced.js'],
    env: { NODE_ENV: 'debug', LOG_LEVEL: 'debug', DEBUG: '*' }
  }
};

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// 显示欢迎信息
function showWelcome() {
  console.log('\n' + colors.cyan + colors.bright);
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║                                                              ║');
  console.log('║     中文文本拼音标注工具  |  Chinese Pinyin Annotator      ║');
  console.log('║                                                              ║');
  console.log('║          智能拼音标注  •  DOCX/PDF导出  •  一键启动          ║');
  console.log('║                                                              ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log(colors.reset + '\n');
}

// 显示使用说明
function showUsage() {
  console.log(colors.yellow + '使用方法 Usage:' + colors.reset);
  console.log('  node start.js [模式] [选项]');
  console.log('  npm start [模式] [选项]');
  console.log('');
  console.log(colors.yellow + '可用模式 Available Modes:' + colors.reset);
  
  Object.keys(MODES).forEach(mode => {
    const config = MODES[mode];
    console.log(`  ${colors.green}${mode.padEnd(12)}${colors.reset} - ${config.description}`);
  });
  
  console.log('');
  console.log(colors.yellow + '示例 Examples:' + colors.reset);
  console.log('  node start.js production    # 启动生产模式');
  console.log('  node start.js development   # 启动开发模式');
  console.log('  node start.js portable      # 启动便携模式');
  console.log('  npm start                   # 默认启动生产模式');
  console.log('');
}

// 检查环境
function checkEnvironment(mode) {
  console.log(colors.cyan + '[环境检查] Environment Check:' + colors.reset);
  
  // 检查Node.js版本
  const nodeVersion = process.version;
  console.log(`  Node.js版本: ${colors.green}${nodeVersion}${colors.reset}`);
  
  // 检查主应用文件
  const appPath = path.join(__dirname, 'src', 'app_enhanced.js');
  if (fs.existsSync(appPath)) {
    console.log(`  主应用文件: ${colors.green}✓ 存在${colors.reset}`);
  } else {
    console.log(`  主应用文件: ${colors.red}✗ 不存在${colors.reset}`);
    return false;
  }
  
  // 检查UI文件
  const uiPath = path.join(__dirname, 'ui', 'index.html');
  if (fs.existsSync(uiPath)) {
    console.log(`  UI界面文件: ${colors.green}✓ 存在${colors.reset}`);
  } else {
    console.log(`  UI界面文件: ${colors.red}✗ 不存在${colors.reset}`);
    return false;
  }
  
  // 模式特定检查
  if (mode === 'portable') {
    const nodeExePath = process.platform === 'win32' ? 
      path.join(__dirname, 'node', 'node.exe') : 
      path.join(__dirname, 'node', 'node');
    
    if (fs.existsSync(nodeExePath)) {
      console.log(`  便携Node.js: ${colors.green}✓ 存在${colors.reset}`);
    } else {
      console.log(`  便携Node.js: ${colors.yellow}⚠ 未找到，将使用系统Node.js${colors.reset}`);
    }
  }
  
  console.log('');
  return true;
}

// 启动应用
function startApplication(mode, customArgs = []) {
  const config = MODES[mode];
  if (!config) {
    console.error(colors.red + `错误: 未知模式 "${mode}"` + colors.reset);
    showUsage();
    process.exit(1);
  }
  
  console.log(colors.cyan + `[启动模式] Launch Mode: ${colors.bright}${config.name}${colors.reset}`);
  console.log(colors.cyan + `[模式描述] Description: ${config.description}${colors.reset}\n`);
  
  // 环境检查
  if (!checkEnvironment(mode)) {
    console.error(colors.red + '环境检查失败，无法启动应用' + colors.reset);
    process.exit(1);
  }
  
  // 构建命令
  let script = config.script;
  let args = [...config.args, ...customArgs];
  
  // 便携模式特殊处理
  if (mode === 'portable' && fs.existsSync(path.join(__dirname, 'node', 'node.exe'))) {
    script = path.join(__dirname, 'node', 'node.exe');
  }
  
  // 设置环境变量
  const env = { ...process.env, ...config.env };
  
  console.log(colors.green + `[启动中] Starting application...${colors.reset}`);
  console.log(colors.gray + `命令: ${script} ${args.join(' ')}${colors.reset}\n`);
  
  // 启动子进程
  const child = spawn(script, args, {
    stdio: 'inherit',
    env: env,
    cwd: __dirname
  });
  
  child.on('error', (error) => {
    console.error(colors.red + `启动失败: ${error.message}${colors.reset}`);
    process.exit(1);
  });
  
  child.on('exit', (code) => {
    if (code === 0) {
      console.log(colors.green + `\n[完成] 应用正常退出${colors.reset}`);
    } else {
      console.log(colors.yellow + `\n[警告] 应用异常退出 (代码: ${code})${colors.reset}`);
    }
    process.exit(code);
  });
  
  // 处理Ctrl+C
  process.on('SIGINT', () => {
    console.log(colors.yellow + '\n[信息] 收到中断信号，正在关闭应用...' + colors.reset);
    child.kill('SIGINT');
  });
}

// 主函数
function main() {
  showWelcome();
  
  const args = process.argv.slice(2);
  const mode = args[0] || 'production';
  const customArgs = args.slice(1);
  
  // 帮助选项
  if (mode === '--help' || mode === '-h' || mode === 'help') {
    showUsage();
    process.exit(0);
  }
  
  // 版本信息
  if (mode === '--version' || mode === '-v') {
    const packageJson = require('./package.json');
    console.log(`${colors.green}版本 Version: ${packageJson.version}${colors.reset}`);
    console.log(`${colors.green}作者 Author: ${packageJson.author}${colors.reset}`);
    process.exit(0);
  }
  
  startApplication(mode, customArgs);
}

// 错误处理
process.on('uncaughtException', (error) => {
  console.error(colors.red + `未捕获异常: ${error.message}${colors.reset}`);
  console.error(error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(colors.red + `未处理拒绝: ${reason}${colors.reset}`);
  process.exit(1);
});

// 启动应用
if (require.main === module) {
  main();
}

module.exports = { startApplication, MODES };