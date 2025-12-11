@echo off
echo Starting Juxin MCP Web Server...
echo.

:: 检查Node.js是否安装
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed. Please install Node.js first.
    echo Visit https://nodejs.org/ to download and install.
    pause
    exit /b 1
)

:: 检查依赖是否安装
if not exist node_modules (
    echo Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo Error: Failed to install dependencies.
        pause
        exit /b 1
    )
)

:: 检查上级目录的MCP服务器是否已构建
if not exist "..\dist\index.js" (
    echo Building MCP server...
    cd ..
    npm run build
    if %errorlevel% neq 0 (
        echo Error: Failed to build MCP server.
        pause
        exit /b 1
    )
    cd web-server
)

:: 创建必要的目录
if not exist uploads mkdir uploads
if not exist ..\tasks.json (
    echo Creating empty tasks.json...
    echo {} > ..\tasks.json
)

:: 启动服务器
echo.
echo ========================================
echo   Juxin MCP Web Interface
echo ========================================
echo.
echo Web Interface: http://localhost:3033
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

node server.js