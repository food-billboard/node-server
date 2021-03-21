# 该 image 文件继承官方的 node image，冒号表示标签，这里标签是8.4，即8.4版本的 node。
FROM node:12.14.1
RUN mkdir -P /movie_server
RUN mkdir -p /movie_server/app
RUN mkdir -P /movie_server/app/static
# 将当前目录下的所有文件（除了.dockerignore排除的路径），都拷贝进入 image 文件的/app目录。
# RUN yum -y install git
# RUN git reset --hard
COPY ./ /movie_server/app
# 指定接下来的工作路径为/app。
WORKDIR /movie_server/app/
# RUN npm install -g pm2
# RUN pm2 deploy pm2.config.js production update
# 在/app目录下，运行npm install命令安装依赖。注意，安装后所有的依赖，都将打包进入 image 文件。
RUN npm install
# 将容器 4000 端口暴露出来， 允许外部连接这个端口。
EXPOSE 4000
# 这一行表示等运行image时在shell中自动输入的命令，不用我们自己再去node文件了。
# CMD [ "npm", "prod" ]