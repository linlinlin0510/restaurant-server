@echo off
echo 正在启动服务器...

:: 检查MongoDB是否已启动
tasklist /FI "IMAGENAME eq mongod.exe" 2>NUL | find /I /N "mongod.exe">NUL
if "%ERRORLEVEL%"=="1" (
    echo MongoDB未运行，正在启动...
    start /B mongod --config "mongodb.conf"
    timeout /t 5
)

:: 安装依赖（如果需要）
if not exist "node_modules" (
    echo 安装依赖...
    call npm install
)

:: 设置环境变量
set NODE_ENV=development
set PORT=3002

:: 启动服务器
echo 启动后端服务器...
node src/index.js 