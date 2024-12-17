#!/bin/bash

# 确保 MongoDB 正在运行
if ! pgrep -x "mongod" > /dev/null
then
    echo "启动 MongoDB..."
    mongod --fork --logpath /var/log/mongodb/mongod.log
fi

# 安装依赖
npm install --production

# 使用 PM2 启动应用
pm2 start ecosystem.config.js --env production

# 保存 PM2 进程列表
pm2 save

# 设置开机自启
pm2 startup 