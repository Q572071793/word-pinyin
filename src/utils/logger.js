const fs = require('fs');
const path = require('path');

class Logger {
  constructor() {
    this.logDir = path.join(__dirname, '../../logs');
    this.ensureLogDirectory();
    this.logLevel = process.env.LOG_LEVEL || 'info';
    this.logToFile = process.env.LOG_TO_FILE !== 'false';
    this.logToConsole = process.env.LOG_TO_CONSOLE !== 'false';
  }

  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  getTimestamp() {
    return new Date().toISOString();
  }

  getLogFile() {
    const date = new Date().toISOString().split('T')[0];
    return path.join(this.logDir, `app-${date}.log`);
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = this.getTimestamp();
    const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
  }

  shouldLog(level) {
    const levels = { error: 0, warn: 1, info: 2, debug: 3 };
    return levels[level] <= levels[this.logLevel];
  }

  writeLog(level, message, meta = {}) {
    if (!this.shouldLog(level)) return;

    const formattedMessage = this.formatMessage(level, message, meta);
    
    // 输出到控制台
    if (this.logToConsole) {
      console.log(formattedMessage);
    }
    
    // 写入文件
    if (this.logToFile) {
      const logFile = this.getLogFile();
      fs.appendFileSync(logFile, formattedMessage + '\n');
    }
  }

  error(message, meta = {}) {
    this.writeLog('error', message, meta);
  }

  warn(message, meta = {}) {
    this.writeLog('warn', message, meta);
  }

  info(message, meta = {}) {
    this.writeLog('info', message, meta);
  }

  debug(message, meta = {}) {
    this.writeLog('debug', message, meta);
  }

  // 专门用于API请求的日志
  logRequest(method, url, statusCode, duration, meta = {}) {
    const message = `${method} ${url} ${statusCode} (${duration}ms)`;
    this.info(message, {
      type: 'request',
      method,
      url,
      statusCode,
      duration,
      ...meta
    });
  }

  // 专门用于错误日志
  logError(error, context = '') {
    this.error(`错误发生: ${context}`, {
      message: error.message,
      stack: error.stack,
      type: error.constructor.name,
      context
    });
  }

  // 获取日志统计信息
  getLogStats() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const logFile = path.join(this.logDir, `app-${today}.log`);
      
      if (!fs.existsSync(logFile)) {
        return { error: 0, warn: 0, info: 0, debug: 0, total: 0 };
      }

      const content = fs.readFileSync(logFile, 'utf8');
      const lines = content.split('\n').filter(line => line.trim());
      
      const stats = { error: 0, warn: 0, info: 0, debug: 0, total: lines.length };
      
      lines.forEach(line => {
        if (line.includes('[ERROR]')) stats.error++;
        else if (line.includes('[WARN]')) stats.warn++;
        else if (line.includes('[INFO]')) stats.info++;
        else if (line.includes('[DEBUG]')) stats.debug++;
      });
      
      return stats;
    } catch (error) {
      this.error('获取日志统计失败', { error: error.message });
      return { error: 0, warn: 0, info: 0, debug: 0, total: 0 };
    }
  }

  // 清理旧日志文件（保留最近30天）
  cleanupOldLogs() {
    try {
      const files = fs.readdirSync(this.logDir);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      let deletedCount = 0;
      
      files.forEach(file => {
        if (file.startsWith('app-') && file.endsWith('.log')) {
          const filePath = path.join(this.logDir, file);
          const stats = fs.statSync(filePath);
          
          if (stats.mtime < thirtyDaysAgo) {
            fs.unlinkSync(filePath);
            deletedCount++;
          }
        }
      });
      
      if (deletedCount > 0) {
        this.info(`清理了 ${deletedCount} 个旧日志文件`);
      }
    } catch (error) {
      this.error('清理旧日志失败', { error: error.message });
    }
  }
}

// 创建全局日志实例
const logger = new Logger();

module.exports = logger;