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