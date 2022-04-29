# Node+MongoDB服务器(娱乐)

## 当前服务用作以下应用的服务端  
1. [电影推荐小程序](https://github.com/food-billboard/movie-weapp)   
2. [管理后台](https://github.com/food-billboard/mini-app-management)
3. [聊天Demo](https://github.com/food-billboard/chat-demo)  
4. [数据可视化大屏设计器](https://github.com/food-billboard/create-chart)

## 介绍  
- 这是一个关于电影推荐相关的`Node`后台服务。其中包含了电影数据，用户数据等的Api接口。  
- 后续也新增了一些其他的接口服务。    
### 接口  
- 详细的Api接口包含如下  
  1. 游客接口  
    - 弹幕  
    - 用户信息  
    - 排行榜、每日上新、热门、分类、专题等
    - 登录、注册等  
    - 电影数据、搜索等    
    - 小程序信息  
  2. 会员接口  
    - 弹幕  
    - 个人信息、好友申请、点赞、评论、关注、反馈等  
    - 电影数据  
    - 文件上传  
    - 用户信息  
  3. 管理后台接口  
    - 个人信息  
    - 聊天室相关  
    - 用户、电影等统计  
    - 小程序信息、专题等  
    - 媒体资源  
    - 电影数据、评论等  
    - 用户数据  
  4. 聊天室接口  
    - 聊天室成员
    - 聊天室消息  
    - 聊天室  
  5. 可视化大屏接口  
    - 大屏列表  
    - 大屏模板列表  
    - 大屏分享  
    - 大屏预览  

- 接口文档地址(本地文档)  
  [聊天室](http://localhost:4000/api/backend/swagger/chat.html)  
  [会员](http://localhost:4000/api/backend/swagger/customer.html)  
  [游客](http://localhost:4000/api/backend/swagger/user.html)  
  [管理后台](http://localhost:4000/api/backend/swagger/manage.html)  
  [可视化大屏](http://localhost:4000/api/backend/swagger/screen.html)    

### 框架  
基础: `Koa`  
数据库: `Mongodb`  
缓存: `redis`  
聊天: `socket.io`  

### 关于已有命令使用 
1. 测试 `npm run internal_test`  
2. 测试覆盖率 `npm run coverage`
3. 开发环境启动 `npm run dev:nodemon`  
4. 生产环境启动  `npm run prod:pm2`  

### Mark  
- 静态资源在数据库中的目录是`/static/[image|video|other]/xxxx.xx`
