@echo off
echo 正在启动生产环境服务器...

:: 检查MongoDB是否已启动
tasklist /FI "IMAGENAME eq mongod.exe" 2>NUL | find /I /N "mongod.exe">NUL
if "%ERRORLEVEL%"=="1" (
    echo 启动MongoDB服务...
    start mongod --config "mongodb.conf"
    timeout /t 5
)

:: 设置环境变量
set NODE_ENV=production

:: 安装全局PM2
call npm install pm2 -g

:: 安装项目依赖
call npm install --production

:: 使用PM2启动应用
call pm2 delete restaurant-server 2>NUL
call pm2 start ecosystem.config.js --env production

:: 保存PM2进程列表
call pm2 save

:: 显示运行状态
call pm2 status

echo.
echo 服务器启动完成！
echo 使用 pm2 status 查看服务状态
echo 使用 pm2 logs 查看日志
echo 使用 pm2 monit 查看实时监控
echo.
pause 