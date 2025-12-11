#!/bin/bash

echo "Starting Juxin MCP Web Server..."
echo

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install Node.js first."
    echo "Visit https://nodejs.org/ to download and install."
    exit 1
fi

# 检查依赖是否安装
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
    if [ $? -neq 0 ]; then
        echo "Error: Failed to install dependencies."
        exit 1
    fi
fi

# 检查上级目录的MCP服务器是否已构建
if [ ! -f "../dist/index.js" ]; then
    echo "Building MCP server..."
    cd ..
    npm run build
    if [ $? -neq 0 ]; then
        echo "Error: Failed to build MCP server."
        exit 1
    fi
    cd web-server
fi

# 创建必要的目录
mkdir -p uploads
if [ ! -f "../tasks.json" ]; then
    echo "Creating empty tasks.json..."
    echo "{}" > ../tasks.json
fi

# 启动服务器
echo
echo "========================================"
echo "  Juxin MCP Web Interface"
echo "========================================"
echo
echo "Web Interface: http://localhost:3033"
echo
echo "Press Ctrl+C to stop the server"
echo "========================================"
echo

node server.js