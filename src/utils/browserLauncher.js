const { exec } = require('child_process');
const logger = require('./logger');

/**
 * 浏览器自动打开工具类
 */
class BrowserLauncher {
    constructor() {
        this.platform = process.platform;
    }

    /**
     * 自动打开浏览器
     * @param {string} url - 要打开的URL
     * @param {Object} options - 选项
     * @returns {Promise<void>}
     */
    async openBrowser(url, options = {}) {
        const { wait = true, timeout = 5000 } = options;
        
        if (logger && logger.info) {
            logger.info('正在打开浏览器', { url, platform: this.platform });
        }

        try {
            const command = this.getBrowserCommand(url);
            
            return new Promise((resolve, reject) => {
                const child = exec(command, (error) => {
                    if (error) {
                        if (logger && logger.error) {
                            logger.error('打开浏览器失败', { error: error.message });
                        }
                        reject(error);
                    } else {
                        if (logger && logger.info) {
                            logger.info('浏览器打开成功', { url });
                        }
                        resolve();
                    }
                });

                if (wait) {
                    setTimeout(() => {
                        if (logger && logger.info) {
                            logger.info('浏览器打开命令已发送', { url });
                        }
                        resolve();
                    }, timeout);
                }
            });
        } catch (error) {
            if (logger && logger.error) {
                logger.error('浏览器启动错误', { error: error.message });
            }
            throw error;
        }
    }

    /**
     * 获取当前平台的浏览器打开命令
     * @param {string} url - URL
     * @returns {string} - 命令字符串
     */
    getBrowserCommand(url) {
        switch (this.platform) {
            case 'darwin': // macOS
                return `open "${url}"`;
            
            case 'win32': // Windows
                return `start "" "${url}"`;
            
            case 'linux': // Linux
                return `xdg-open "${url}"`;
            
            default:
                // 尝试通用方法
                return `open "${url}" || xdg-open "${url}" || start "" "${url}"`;
        }
    }

    /**
     * 检测默认浏览器
     * @returns {Promise<string>} - 默认浏览器名称
     */
    async detectDefaultBrowser() {
        return new Promise((resolve) => {
            let command;
            
            switch (this.platform) {
                case 'darwin':
                    command = 'defaults read com.apple.LaunchServices/com.apple.launchservices.secure | grep http -b3 -A3';
                    break;
                
                case 'win32':
                    command = 'reg query "HKEY_CLASSES_ROOT\\http\\shell\\open\\command" /ve';
                    break;
                
                case 'linux':
                    command = 'xdg-settings get default-web-browser';
                    break;
                
                default:
                    resolve('unknown');
                    return;
            }

            exec(command, (error, stdout) => {
                if (error) {
                    resolve('unknown');
                } else {
                    const browserName = this.parseBrowserName(stdout);
                    resolve(browserName);
                }
            });
        });
    }

    /**
     * 解析浏览器名称
     * @param {string} output - 命令输出
     * @returns {string} - 浏览器名称
     */
    parseBrowserName(output) {
        const lowerOutput = output.toLowerCase();
        
        if (lowerOutput.includes('chrome')) return 'Google Chrome';
        if (lowerOutput.includes('firefox')) return 'Mozilla Firefox';
        if (lowerOutput.includes('safari')) return 'Apple Safari';
        if (lowerOutput.includes('edge')) return 'Microsoft Edge';
        if (lowerOutput.includes('opera')) return 'Opera';
        
        return 'Unknown Browser';
    }

    /**
     * 延迟打开浏览器（用于等待服务器启动）
     * @param {string} url - URL
     * @param {number} delay - 延迟时间（毫秒）
     * @param {Object} options - 选项
     * @returns {Promise<void>}
     */
    async openBrowserWithDelay(url, delay = 2000, options = {}) {
        if (logger && logger.info) {
            logger.info(`等待 ${delay}ms 后打开浏览器`, { url });
        }

        return new Promise((resolve) => {
            setTimeout(async () => {
                try {
                    await this.openBrowser(url, options);
                    resolve();
                } catch (error) {
                    if (logger && logger.error) {
                        logger.error('延迟打开浏览器失败', { error: error.message });
                    }
                    resolve(); // 不抛出错误，继续执行
                }
            }, delay);
        });
    }

    /**
     * 检查浏览器是否可用
     * @returns {Promise<boolean>} - 浏览器是否可用
     */
    async isBrowserAvailable() {
        return new Promise((resolve) => {
            const testCommand = this.platform === 'win32' ? 'start /?' : 'which open || which xdg-open';
            
            exec(testCommand, (error) => {
                resolve(!error);
            });
        });
    }
}

module.exports = BrowserLauncher;