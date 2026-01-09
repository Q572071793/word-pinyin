#!/bin/bash

# 中文文本拼音标注工具 - Linux/macOS 启动脚本
# Chinese Text Pinyin Annotator - Linux/macOS Startup Script

set -e  # 遇到错误时退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# 显示欢迎信息
show_welcome() {
    echo -e "\n${CYAN}${BOLD}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                                                              ║"
    echo "║     中文文本拼音标注工具  |  Chinese Pinyin Annotator      ║"
    echo "║                                                              ║"
    echo "║          智能拼音标注  •  DOCX/PDF导出  •  一键启动          ║"
    echo "║                                                              ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}\n"
}

# 检查依赖
check_dependencies() {
    echo -e "${CYAN}[环境检查] Environment Check:${NC}"
    
    # 检查Node.js
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        echo -e "  Node.js版本: ${GREEN}✓ ${NODE_VERSION}${NC}"
    else
        echo -e "  Node.js: ${RED}✗ 未找到 Node.js${NC}"
        echo -e "  ${YELLOW}请先安装 Node.js (版本 >= 14.0.0)${NC}"
        exit 1
    fi
    
    # 检查npm
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm --version)
        echo -e "  npm版本: ${GREEN}✓ ${NPM_VERSION}${NC}"
    else
        echo -e "  npm: ${YELLOW}⚠ 未找到 npm${NC}"
    fi
    
    # 检查主应用文件
    if [ -f "src/app_enhanced.js" ]; then
        echo -e "  主应用文件: ${GREEN}✓ 存在${NC}"
    else
        echo -e "  主应用文件: ${RED}✗ 不存在${NC}"
        exit 1
    fi
    
    # 检查UI文件
    if [ -f "ui/index.html" ]; then
        echo -e "  UI界面文件: ${GREEN}✓ 存在${NC}"
    else
        echo -e "  UI界面文件: ${RED}✗ 不存在${NC}"
        exit 1
    fi
    
    echo ""
}

# 安装依赖
install_dependencies() {
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}[依赖安装] Installing dependencies...${NC}"
        npm install
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}[成功] 依赖安装完成${NC}"
        else
            echo -e "${RED}[错误] 依赖安装失败${NC}"
            exit 1
        fi
    else
        echo -e "${GREEN}[信息] 依赖已存在，跳过安装${NC}"
    fi
    echo ""
}

# 创建必要目录
create_directories() {
    echo -e "${CYAN}[目录检查] Directory Setup:${NC}"
    
    # 创建临时目录
    if [ ! -d "temp" ]; then
        mkdir -p temp
        echo -e "  临时目录: ${GREEN}✓ 创建${NC}"
    else
        echo -e "  临时目录: ${GREEN}✓ 存在${NC}"
    fi
    
    # 创建日志目录
    if [ ! -d "logs" ]; then
        mkdir -p logs
        echo -e "  日志目录: ${GREEN}✓ 创建${NC}"
    else
        echo -e "  日志目录: ${GREEN}✓ 存在${NC}"
    fi
    
    # 创建输出目录
    if [ ! -d "output" ]; then
        mkdir -p output
        echo -e "  输出目录: ${GREEN}✓ 创建${NC}"
    else
        echo -e "  输出目录: ${GREEN}✓ 存在${NC}"
    fi
    
    echo ""
}

# 启动应用
start_application() {
    echo -e "${GREEN}[启动中] Starting application...${NC}"
    echo -e "${CYAN}命令: node src/app_enhanced.js${NC}\n"
    
    # 设置环境变量
    export NODE_ENV=production
    export LOG_LEVEL=info
    
    # 启动应用
    node src/app_enhanced.js
    
    # 检查退出状态
    if [ $? -eq 0 ]; then
        echo -e "\n${GREEN}[完成] 应用正常退出${NC}"
    else
        echo -e "\n${RED}[错误] 应用异常退出${NC}"
        exit 1
    fi
}

# 清理函数
cleanup() {
    echo -e "\n${YELLOW}[信息] 收到中断信号，正在关闭应用...${NC}"
    # 这里可以添加清理逻辑
    exit 0
}

# 信号处理
trap cleanup SIGINT SIGTERM

# 主函数
main() {
    show_welcome
    
    # 检查命令行参数
    case "${1:-}" in
        "install")
            check_dependencies
            install_dependencies
            ;;
        "check")
            check_dependencies
            ;;
        "help"|"-h"|"--help")
            echo "使用方法:"
            echo "  $0 [命令]"
            echo ""
            echo "可用命令:"
            echo "  install    安装依赖"
            echo "  check      检查环境"
            echo "  help       显示帮助"
            echo "  (无参数)   启动应用"
            exit 0
            ;;
        *)
            check_dependencies
            create_directories
            start_application
            ;;
    esac
}

# 错误处理
set +e

# 启动应用
main "$@"