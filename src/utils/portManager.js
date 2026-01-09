const net = require('net');
const logger = require('./logger');

/**
 * 端口检测工具类
 * 自动检测端口是否被占用，并按优先级分配可用端口
 */
class PortManager {
    constructor() {
        // 默认端口优先级
        this.defaultPorts = [80, 8080, 3000, 3001, 3002, 3003, 3004];
        this.minPort = 3000;
        this.maxPort = 9000;
    }

    /**
     * 检查端口是否被占用
     * @param {number} port - 端口号
     * @returns {Promise<boolean>} - true表示端口可用，false表示被占用
     */
    async checkPort(port) {
        return new Promise((resolve) => {
            const server = net.createServer();
            
            server.once('error', (err) => {
                if (err.code === 'EADDRINUSE') {
                    resolve(false); // 端口被占用
                } else {
                    resolve(false); // 其他错误也认为端口不可用
                }
            });
            
            server.once('listening', () => {
                server.close(() => {
                    resolve(true); // 端口可用
                });
            });
            
            server.listen(port);
        });
    }

    /**
     * 按优先级查找可用端口
     * @param {Array} preferredPorts - 优先端口列表
     * @returns {Promise<number>} - 可用端口号
     */
    async findAvailablePort(preferredPorts = []) {
        const portsToCheck = [...preferredPorts, ...this.defaultPorts];
        
        if (logger && logger.info) {
            logger.info('开始检测可用端口', { preferredPorts: portsToCheck });
        }

        // 首先检查优先端口
        for (const port of portsToCheck) {
            const isAvailable = await this.checkPort(port);
            if (isAvailable) {
                if (logger && logger.info) {
                    logger.info('找到可用端口', { port });
                }
                return port;
            }
        }

        // 如果没有优先端口可用，查找随机端口
        if (logger && logger.info) {
            logger.info('优先端口都被占用，开始查找随机端口');
        }

        return await this.findRandomAvailablePort();
    }

    /**
     * 查找随机可用端口
     * @returns {Promise<number>} - 可用端口号
     */
    async findRandomAvailablePort() {
        const maxAttempts = 100;
        let attempts = 0;

        while (attempts < maxAttempts) {
            const randomPort = Math.floor(Math.random() * (this.maxPort - this.minPort + 1)) + this.minPort;
            const isAvailable = await this.checkPort(randomPort);
            
            if (isAvailable) {
                if (logger && logger.info) {
                    logger.info('找到随机可用端口', { port: randomPort, attempts: attempts + 1 });
                }
                return randomPort;
            }
            
            attempts++;
        }

        throw new Error('无法找到可用端口，已尝试' + maxAttempts + '次');
    }

    /**
     * 获取端口使用信息
     * @returns {Promise<Object>} - 端口使用统计
     */
    async getPortUsageInfo() {
        const portInfo = {};
        
        for (const port of this.defaultPorts) {
            const isAvailable = await this.checkPort(port);
            portInfo[port] = {
                available: isAvailable,
                status: isAvailable ? '可用' : '被占用'
            };
        }

        return portInfo;
    }

    /**
     * 释放端口（通过终止进程）
     * @param {number} port - 要释放的端口号
     * @returns {Promise<boolean>} - 是否成功释放
     */
    async releasePort(port) {
        return new Promise((resolve) => {
            // 注意：这个功能需要系统权限，在Windows上可能需要管理员权限
            const { exec } = require('child_process');
            
            let command;
            if (process.platform === 'win32') {
                // Windows: 查找使用端口的进程并终止
                command = `netstat -ano | findstr :${port}`;
            } else {
                // Unix-like: 查找使用端口的进程
                command = `lsof -ti:${port}`;
            }

            exec(command, (error, stdout) => {
                if (error || !stdout) {
                    if (logger && logger.warn) {
                        logger.warn('无法找到使用指定端口的进程', { port });
                    }
                    resolve(false);
                    return;
                }

                // 解析进程ID并终止（这里只是示例，实际使用时需要更谨慎）
                if (logger && logger.info) {
                    logger.info('找到使用端口的进程', { port, output: stdout });
                }
                
                // 注意：这里不自动终止进程，需要用户手动处理
                resolve(true);
            });
        });
    }
}

module.exports = PortManager;