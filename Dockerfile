# 该 image 文件继承官方的 node image，冒号表示标签，这里标签是8.4，即8.4版本的 node。
FROM node:12.14.1
# 将当前目录下的所有文件（除了.dockerignore排除的路径），都拷贝进入 image 文件的/app目录。
COPY ./ /app
# 指定接下来的工作路径为/app。
WORKDIR /app
# 在/app目录下，运行npm install命令安装依赖。注意，安装后所有的依赖，都将打包进入 image 文件。
RUN npm install --registry=https://registry.npm.taobao.org
# 将容器 3000 端口暴露出来， 允许外部连接这个端口。
EXPOSE 4000
# 这一行表示等运行image时在shell中自动输入的命令，不用我们自己再去node文件了。
CMD npm run prod