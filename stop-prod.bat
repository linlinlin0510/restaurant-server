@echo off
echo 正在停止服务器...

:: 停止PM2进程
call pm2 stop restaurant-server
call pm2 delete restaurant-server

:: 停止MongoDB
taskkill /F /IM mongod.exe

echo 服务器已停止！
pause 