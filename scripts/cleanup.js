const fs = require('fs');
const path = require('path');

console.log('🧹 开始清理项目...');

// 清理临时文件
function cleanTempFiles() {
  const tempDir = path.join(__dirname, '../temp');
  if (fs.existsSync(tempDir)) {
    const files = fs.readdirSync(tempDir);
    files.forEach(file => {
      const filePath = path.join(tempDir, file);
      fs.unlinkSync(filePath);
      console.log(`  已删除临时文件: ${file}`);
    });
    console.log(`✅ 清理了 ${files.length} 个临时文件`);
  }
}

// 清理旧日志文件
function cleanOldLogs() {
  const logsDir = path.join(__dirname, '../logs');
  if (fs.existsSync(logsDir)) {
    const files = fs.readdirSync(logsDir);
    const currentDate = new Date().toISOString().split('T')[0];
    
    files.forEach(file => {
      if (!file.includes(currentDate)) {
        const filePath = path.join(logsDir, file);
        fs.unlinkSync(filePath);
        console.log(`  已删除旧日志文件: ${file}`);
      }
    });
  }
}

// 创建必要的目录
function createDirectories() {
  const dirs = ['temp', 'logs', 'output'];
  dirs.forEach(dir => {
    const dirPath = path.join(__dirname, '..', dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`  已创建目录: ${dir}`);
    }
  });
}

try {
  cleanTempFiles();
  cleanOldLogs();
  createDirectories();
  console.log('✅ 清理完成！');
} catch (error) {
  console.error('❌ 清理过程中出现错误:', error.message);
}