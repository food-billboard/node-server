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
7. 文件复制  
```
  docker cp con_Id:con_path host_path
```

## 访问Docker容器内的Redis  
1. 外部执行  
```
  docker exec -it con_Id redis-cli
```

## docker常用命令
1. 停止镜像 `docker stop docker_id`  
2. 删除容器 `docker rm docker_id`  
3. 正在运行的容器 `docker ps`  
4. 所有容器 `docker ps -a`  
5. 删除镜像 `docker rmi docker_id`  
6. 查看镜像 `docker images`
7. 查看容器运行日志 `docker logs docker_id`