# Node+MongoDB服务器(娱乐)

## 当前服务器用作之前写的电影推荐小程序的服务端: https://github.com/food-billboard/movie-weapp

### pm2 相关
`pm2 start <file-name>` 启动服务  
`--name <process-name>` 重命名进程  
`--watch` 监听  
`pm2 stop <file-name>` 暂停指定进程  
`pm2 stop all` 暂停所有进程  
`pm2 delete <file-name>` 删除指定进程  
`pm2 delete all` 删除所有进程  
`pm2 list` 进程列表  
`pm2 describe <name>` 查看指定进程的具体情况  
`pm2 monit <name>` 查看指定进程资源消耗情况  
`pm2 logs` 查看所有日志  
`pm2 logs <name>` 查看指定进程之日  
`pm2 restart <name>` 重启指定进程  
`pm2 restart all` 重启所有进程  

### 开发
1. 测试 `npm run test`  
2. 测试覆盖率 `npm run coverage`
3. mongodb  
- 安装
- 启动
4. redis  
- 安装
- 启动
5. ffmpeg  
- 安装
- 启动
6. 开发环境启动 `npm run dev`
7. 开发生产环境启动  `npm run dev_prod`  
8. 生产环境启动  `npm run prod`  
9. 生产环境重启  `npm run restart`   

### 构建
1. grunt  
- 更新npm `[sudo] npm update -g npm`  
- 安装cli `[sudo] npm install -g grunt-cli`
