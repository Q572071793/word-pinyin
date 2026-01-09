const { spawn, exec } = require('child_process');
const net = require('net');
const fs = require('fs');
const path = require('path');
const http = require('http');

class ServerManager {
  constructor() {
    this.ports = [80, 8080, 3000, 3001, 3002, 3003, 3004]; // 端口优先级列表
    this.currentPortIndex = 0;
    this.port = this.ports[0];
    this.serverProcess = null;
    this.pidFile = path.join(__dirname, 'server.pid');
  }

  // 查找可用端口
  async findAvailablePort() {
    for (let i = 0; i < this.ports.length; i++) {
      const port = this.ports[i];
      const isInUse = await this.checkPortInUse(port);
      
      if (!isInUse) {
        console.log(`✅ 端口 ${port} 可用`);
        return port;
      } else {
        console.log(`⚠️  端口 ${port} 被占用，尝试下一个...`);
      }
    }
    
    throw new Error('所有端口都被占用，请手动检查端口使用情况');
  }

  // 检查端口是否被占用
  checkPortInUse(port = this.port) {
    return new Promise((resolve) => {
      const server = net.createServer();
      
      server.once('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          resolve(true); // 端口被占用
        } else {
          resolve(false);
        }
      });

      server.once('listening', () => {
        server.close();
        resolve(false); // 端口可用
      });

      server.listen(port);
    });
  }

  // 通过PID文件停止之前的服务
  stopPreviousServer() {
    return new Promise((resolve) => {
      if (fs.existsSync(this.pidFile)) {
        try {
          const pid = parseInt(fs.readFileSync(this.pidFile, 'utf8'));
          console.log(`🛑 正在停止之前的服务 (PID: ${pid})...`);
          
          // 尝试优雅终止进程
          process.kill(pid, 'SIGTERM');
          
          // 等待进程终止
          setTimeout(() => {
            try {
              // 检查进程是否还在运行
              process.kill(pid, 0);
              // 如果进程还在，强制终止
              process.kill(pid, 'SIGKILL');
              console.log('✅ 已强制终止之前的服务');
            } catch (e) {
              console.log('✅ 之前的服务已正常停止');
            }
            // 安全删除PID文件（如果存在）
            if (fs.existsSync(this.pidFile)) {
              fs.unlinkSync(this.pidFile);
            }
            resolve();
          }, 2000);
        } catch (error) {
          console.log('⚠️  无法停止之前的服务:', error.message);
          // 清理PID文件
          if (fs.existsSync(this.pidFile)) {
            fs.unlinkSync(this.pidFile);
          }
          resolve();
        }
      } else {
        resolve();
      }
    });
  }

  // 通过端口查找并终止进程（备用方法）
  killProcessByPort(port = this.port) {
    return new Promise((resolve) => {
      console.log(`🔍 正在检查端口 ${port} 的占用情况...`);
      
      // Windows系统使用 netstat
      const command = process.platform === 'win32' 
        ? `netstat -ano | findstr :${port}`
        : `lsof -ti:${port}`;

      exec(command, (error, stdout, stderr) => {
        if (error || !stdout) {
          console.log(`✅ 端口 ${this.port} 未被占用`);
          resolve();
          return;
        }

        if (process.platform === 'win32') {
          // Windows: 解析 netstat 输出
          const lines = stdout.trim().split('\n');
          lines.forEach(line => {
            const parts = line.trim().split(/\s+/);
            if (parts.length >= 5) {
              const pid = parts[4];
              if (pid && pid !== '0') {
                console.log(`🛑 正在终止占用端口的进程 (PID: ${pid})...`);
                try {
                  exec(`taskkill /PID ${pid} /F`, () => {
                    console.log(`✅ 已终止进程 ${pid}`);
                  });
                } catch (e) {
                  console.log(`⚠️  无法终止进程 ${pid}`);
                }
              }
            }
          });
        } else {
          // Unix系统: 直接获取PID
          const pid = stdout.trim();
          if (pid) {
            console.log(`🛑 正在终止占用端口的进程 (PID: ${pid})...`);
            try {
              process.kill(parseInt(pid), 'SIGTERM');
              console.log(`✅ 已终止进程 ${pid}`);
            } catch (e) {
              console.log(`⚠️  无法终止进程 ${pid}`);
            }
          }
        }
        
        setTimeout(resolve, 1000);
      });
    });
  }

  // 打开浏览器
  openBrowser() {
    const url = `http://localhost:${this.port}`;
    
    // 首先检查服务是否真正可用
    this.checkServiceReady(url).then(isReady => {
      if (!isReady) {
        console.log('⚠️  服务尚未完全就绪，延迟打开浏览器...');
        setTimeout(() => {
          this.openBrowser();
        }, 1000);
        return;
      }
      
      console.log(`🌐 正在打开浏览器访问: ${url}`);
      
      const platform = process.platform;
      let command;
      
      if (platform === 'win32') {
        command = `start "" "${url}"`;
      } else if (platform === 'darwin') {
        command = `open "${url}"`;
      } else {
        command = `xdg-open "${url}"`;
      }
      
      exec(command, (error) => {
        if (error) {
          console.log(`⚠️  无法自动打开浏览器，请手动访问: ${url}`);
        } else {
          console.log(`✅ 浏览器已打开: ${url}`);
        }
      });
    }).catch(error => {
      console.log(`⚠️  检查服务状态时出错，请手动访问: ${url}`);
      console.log(`   错误: ${error.message}`);
    });
  }

  // 检查服务是否准备就绪
  checkServiceReady(url) {
    return new Promise((resolve) => {
      const req = http.get(url, (res) => {
        // 只要返回状态码是2xx或3xx就认为服务可用
        resolve(res.statusCode >= 200 && res.statusCode < 400);
      });
      
      req.on('error', () => {
        resolve(false);
      });
      
      req.setTimeout(3000, () => {
        req.destroy();
        resolve(false);
      });
      
      req.end();
    });
  }

  // 启动新服务
  async startServer() {
    try {
      // 0. 查找可用端口
      this.port = await this.findAvailablePort();
      
      // 1. 检查端口是否被占用（再次确认）
      const isPortInUse = await this.checkPortInUse();
      
      if (isPortInUse) {
        console.log(`⚠️  端口 ${this.port} 被占用，正在清理...`);
        
        // 2. 尝试停止之前的服务
        await this.stopPreviousServer();
        
        // 3. 备用方法：通过端口终止进程
        await this.killProcessByPort();
        
        // 4. 再次检查端口
        const stillInUse = await this.checkPortInUse();
        if (stillInUse) {
          console.log(`❌ 端口 ${this.port} 仍然被占用，请手动检查`);
          process.exit(1);
        }
      }

      console.log('🚀 正在启动服务...');
      
      // 启动服务进程，传入端口参数
      this.serverProcess = spawn('node', ['src/app.js'], {
        stdio: 'inherit',
        cwd: __dirname,
        env: { ...process.env, PORT: this.port.toString() }
      });

      // 保存PID到文件
      fs.writeFileSync(this.pidFile, this.serverProcess.pid.toString());
      
      console.log(`✅ 服务已启动 (PID: ${this.serverProcess.pid})`);
      console.log(`🌐 访问地址: http://localhost:${this.port}`);
      
      // 等待服务完全启动后打开浏览器
      setTimeout(() => {
        this.openBrowser();
      }, 2000);

      // 监听进程事件
      this.serverProcess.on('error', (error) => {
        console.error('❌ 服务启动失败:', error);
        if (fs.existsSync(this.pidFile)) {
          fs.unlinkSync(this.pidFile);
        }
        process.exit(1);
      });

      this.serverProcess.on('exit', (code, signal) => {
        console.log(`\n🛑 服务已停止 (退出码: ${code}, 信号: ${signal})`);
        if (fs.existsSync(this.pidFile)) {
          fs.unlinkSync(this.pidFile);
        }
      });

      // 处理优雅关闭
      process.on('SIGINT', () => {
        console.log('\n🔄 正在优雅关闭服务...');
        if (this.serverProcess) {
          this.serverProcess.kill('SIGTERM');
        }
        setTimeout(() => {
          process.exit(0);
        }, 1000);
      });

      process.on('SIGTERM', () => {
        console.log('\n🔄 正在终止服务...');
        if (this.serverProcess) {
          this.serverProcess.kill('SIGKILL');
        }
        process.exit(0);
      });

    } catch (error) {
      console.error('❌ 启动服务时出错:', error);
      process.exit(1);
    }
  }
}

// 主函数
async function main() {
  console.log('🎯 汉字拼音标注工具 - 智能服务启动器');
  console.log('=' .repeat(50));
  
  const serverManager = new ServerManager(3004);
  await serverManager.startServer();
}

// 运行主函数
main().catch(error => {
  console.error('❌ 程序执行失败:', error);
  process.exit(1);
});