#!/bin/bash

# Set UTF-8 encoding
export LANG=zh_CN.UTF-8
export LC_ALL=zh_CN.UTF-8

echo "========================================"
echo " 汉字拼音标注工具 - 一键启动程序"
echo "========================================"
echo

# Check Node.js installation
if ! command -v node &> /dev/null; then
    echo "[错误] 未检测到Node.js环境"
    echo "请先安装Node.js (版本 >= 14.0.0)"
    echo "下载地址: https://nodejs.org/"
    read -p "按回车键退出..."
    exit 1
fi

echo "[信息] Node.js环境检测通过"

# Check dependencies
if [ ! -d "node_modules" ]; then
    echo "[信息] 正在安装项目依赖..."
    npm install
    if [ $? -ne 0 ]; then
        echo "[错误] 依赖安装失败"
        read -p "按回车键退出..."
        exit 1
    fi
    echo "[成功] 依赖安装完成"
else
    echo "[信息] 项目依赖已安装"
fi

# Create directories
mkdir -p temp logs output

echo "[信息] 项目目录结构检查完成"
echo
echo "[信息] 正在启动服务..."
echo

# Start server
npm start

if [ $? -ne 0 ]; then
    echo "[错误] 服务启动失败"
    echo
    echo "请检查以下内容:"
    echo "1. 端口80和8080是否被占用"
    echo "2. 查看logs目录中的错误日志"
    echo
    read -p "按回车键退出..."
    exit 1
fi

echo
echo "[成功] 服务启动成功！"
echo "[信息] 浏览器应该会自动打开应用界面"
echo
read -p "按回车键退出..."