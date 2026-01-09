@echo off
chcp 65001 >nul 2>&1
setlocal enabledelayedexpansion

:: 中文文本拼音标注工具 - Windows 统一启动器
:: Chinese Text Pinyin Annotator - Windows Universal Launcher

color 0A
echo.
echo  ╔══════════════════════════════════════════════════════════════╗
echo  ║                                                              ║
echo  ║     中文文本拼音标注工具  ^|  Chinese Pinyin Annotator      ║
echo  ║                                                              ║
echo  ║          智能拼音标注  •  DOCX/PDF导出  •  一键启动          ║
echo  ║                                                              ║
echo  ╚══════════════════════════════════════════════════════════════╝
echo.

:: 设置变量
set "SCRIPT_DIR=%~dp0"
set "NODE_CMD=node"
set "MODE=production"
set "CUSTOM_ARGS="

:: 解析命令行参数
:parse_args
if "%~1"=="" goto :check_node
if /i "%~1"=="install" goto :install_deps
if /i "%~1"=="dev" set "MODE=development"& shift& goto :parse_args
if /i "%~1"=="debug" set "MODE=debug"& shift& goto :parse_args
if /i "%~1"=="portable" set "MODE=portable"& shift& goto :parse_args
if /i "%~1"=="help" goto :show_help
if /i "%~1"=="-h" goto :show_help
if /i "%~1"=="--help" goto :show_help
if /i "%~1"=="--version" goto :show_version
if /i "%~1"=="-v" goto :show_version
set "CUSTOM_ARGS=%CUSTOM_ARGS% %~1"
shift
goto :parse_args

:show_help
echo 使用方法 Usage:
echo   start.bat [命令] [选项]
echo.
echo 可用命令 Available Commands:
echo   install      安装依赖 Install dependencies
echo   dev          开发模式 Development mode
echo   debug        调试模式 Debug mode  
echo   portable     便携模式 Portable mode
echo   help         显示帮助 Show help
echo   (无参数)     生产模式 Production mode
echo.
echo 示例 Examples:
echo   start.bat dev          # 启动开发模式
echo   start.bat debug        # 启动调试模式
echo   start.bat portable     # 启动便携模式
echo   start.bat install      # 安装依赖
echo.
pause
exit /b 0

:show_version
for /f "tokens=*" %%i in ('node --version 2^>nul') do set "NODE_VERSION=%%i"
echo 版本 Version: 2.0.0
echo Node.js: %NODE_VERSION%
echo 作者 Author: Trae AI
echo.
pause
exit /b 0

:install_deps
echo [依赖安装] Installing dependencies...
call npm install
if %errorlevel% equ 0 (
    echo [成功] 依赖安装完成
) else (
    echo [错误] 依赖安装失败
    pause
    exit /b 1
)
pause
exit /b 0

:check_node
:: 检查Node.js
echo [环境检查] Environment Check:
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo   Node.js: [错误] 未找到 Node.js
    echo   请先安装 Node.js (版本 ^>= 14.0.0)
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do echo   Node.js版本: [成功] %%i

:: 检查主应用文件
if exist "src\app_enhanced.js" (
    echo   主应用文件: [成功] 存在
) else (
    echo   主应用文件: [错误] 不存在
    pause
    exit /b 1
)

:: 检查UI文件
if exist "ui\index.html" (
    echo   UI界面文件: [成功] 存在
) else (
    echo   UI界面文件: [错误] 不存在
    pause
    exit /b 1
)

:: 检查依赖
if "%MODE%"=="portable" goto :check_portable
if not exist "node_modules" (
    echo   依赖包: [警告] 未找到，正在安装...
    call npm install
    if %errorlevel% neq 0 (
        echo   依赖安装: [错误] 安装失败
        pause
        exit /b 1
    )
) else (
    echo   依赖包: [成功] 存在
)

:create_dirs
echo.
echo [目录检查] Directory Setup:

:: 创建临时目录
if not exist "temp" (
    mkdir temp
    echo   临时目录: [成功] 创建
) else (
    echo   临时目录: [成功] 存在
)

:: 创建日志目录
if not exist "logs" (
    mkdir logs
    echo   日志目录: [成功] 创建
) else (
    echo   日志目录: [成功] 存在
)

:: 创建输出目录
if not exist "output" (
    mkdir output
    echo   输出目录: [成功] 创建
) else (
    echo   输出目录: [成功] 存在
)

:start_app
echo.
echo [启动中] Starting application...
echo 模式 Mode: %MODE%
echo.

:: 设置环境变量
set NODE_ENV=%MODE%
set LOG_LEVEL=info

if "%MODE%"=="development" set LOG_LEVEL=debug
if "%MODE%"=="debug" set LOG_LEVEL=debug& set DEBUG=*

:: 启动应用
cd /d "%SCRIPT_DIR%"
node src/app_enhanced.js %CUSTOM_ARGS%

:: 检查退出状态
if %errorlevel% equ 0 (
    echo.
    echo [完成] 应用正常退出
) else (
    echo.
    echo [错误] 应用异常退出 (代码: %errorlevel%)
)
pause
exit /b %errorlevel%

:check_portable
echo   便携模式: [信息] 检查便携Node.js...
if exist "node\node.exe" (
    echo   便携Node.js: [成功] 存在
    set "NODE_CMD=node\node.exe"
) else (
    echo   便携Node.js: [警告] 未找到，将使用系统Node.js
)
goto create_dirs