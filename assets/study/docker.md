## 访问Docker容器内的Mongodb
1. 查看mongodb容器的`container_id`  
```
  docker ps
```
2. 执行进入容器  
```
  docker exec -it con_Id sh //con_id为上一步中容器的id
```
3. 执行`shell`  
```
  mongo
```
4. 退出  
```
 exit
```
5. 查看内部暴露的`ip`  
```
  docker inspect con_Id |grep IPA
```
6. 外部执行
```
  docker exec -it con_Id mongo --host 127.0.0.1 --port 27017
```

## 访问Docker容器内的Redis  
1. 外部执行  
```
  docker exec -it con_Id redis-cli
```

## docker常用命令
1. 停止镜像 `docker stop docker_id`  
2. 删除镜像 `docker rm docker_id`  
3. 正在运行的镜像 `docker ps`  
4. 所有镜像 `docker ps -a`