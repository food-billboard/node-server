# Node+MongoDB服务器(娱乐)

## 当前服务器用作之前写的电影推荐小程序的服务端: https://github.com/food-billboard/movie-weapp

首页
  /api/user/home
  热搜 /hot get params: { count: 数量 }
  轮播图 /swiper get params: { count: 数量 }
  分类 /api/user/movie/classify/specDropList get params: { count: 数量 } 
  每日上新 /daily get params: { count: 数量 }
  排行榜 /rank get params: { count: 数量 }
  获取跑马灯 /notice get
  获取专题电影列表 /special get params: { id: 专题id }
分类
  /api/user/movie/classify
  分类 /specDropList get params: { count: 数量 }  
  分类列表具体信息(列表 | 图标) get params: { currPage: 当前页, pageSize: 数量 }
排行榜
  /api/user/movie/rank
  排行榜 /specDropList get params: { count: 数量 }
  排行榜分类具体 get params: { currPage: 当前页, pageSize: 数量 }
通知
  /api/customer/message
  消息列表 get  
  信息读取 put params: { id: 消息id }
  信息删除 delete params: { id: 消息id }
  通知详情 /detail get params: { id: 消息id }
  发送消息 post data: { 
    content: 消息内容,
    type: 消息类型(image | audio | text | video),
    time: 时间,
    username: 用户名,
    id: 用户id,
    image: 用户头像,
    news: 消息id,
    mineId: 个人id
  }
详情
  /api/user/movie/detail
  电影详情 /api/user/movie/detail get params: { id: 电影id } || /api/customer/movie/detail get params: { id: 电影id, user: 用户id }
  电影评论简易(详情展示) /comment get params: { id: 电影id, count: 数量 }
  电影评论(头部用) /simple get params: { id: 电影id }
  电影评论 /comment/list get params: { currPage: 当前页, pageSize: 数量, id: 电影id }
  评论详细 /comment/detail get params: { currPage: 当前页, pageSize: 数量, id: 评论id }
  点赞 /api/customer/movie/detail/comment/like put params: { id: 评论id, user: 个人id }
  评论 /api/customer/movie/detail/comment post data: { id: 个人id, content: 内容, comment: 回复用户时存在该评论的id  }
  评分 /api/customer/movie/detail/rate put data: { id: 电影id, user: 个人id, value: 分数 }
  收藏 /api/customer/movie/detail/store put data: { id: 电影id, user: 个人id }
  获取电影评分 
设置
  /api/user/setting
  小程序信息 /info get
搜索
  /api/user/movie/search
  获取电影语言列表 /query/lang get
  获取电影导演列表 /query/director get
  获取电影演员列表 /query/actor get
  获取电影地区列表 /query/area get
  获取排序列表 /query/sort get
  搜索栏搜索关键字获取 get params: { content: 搜索内容, area: 地区, director: 导演, actor: 演员, lang: 语言, price: 价格, sort: 排序, time: 时间, fee: 免付费, currPage: 当前页, pageSize: 数量 }
  搜索栏联想 /about get params: { content: 关键字 }
用户管理
/api/customer/manage
  用户关注 /attention get params: { id: 用户id, currpage: 当前页, pageSize: 数量 }
  粉丝 /fans get params: { id: 用户id, currPage: 当前页, pageSize: 数量 }
  关注 /attention put params: { id: 用户id, user: 个人id }
  用户信息 get params: { id: 用户id }
  用户评论 /comment get params: { currPage: 当前页, pageSize: 数量 }
  用户收藏 /movie/store get params: { id: 用户id, currPage: 当前页, pageSize: 数量 }
  浏览记录 /movie/browse get params: { id: 用户id, currPage: 当前页, pageSize: 数量 }
  登录 /api/user/logon/account post data: { userInfo: 用户信息(看微信), code: 微信验证码 }
  退出登录 /api/user/logon/signout post data: { id: 用户id }
  //获取电影是否收藏 
  //注册
  发布电影 /movie put data: { 
    user: 用户id
    video: {
      src: 视频地址
      poster: 海报地址
    } 
    info: {
      name: 电影名称
      area: 地区
      director: 导演
      actor: 演员
      type: 类型
      time: 时间
      description: 描述
      language: 语言
    }
    image: {
      image: 截图地址,
      id: id
    }
  }
  修改电影 /movie post data: { 
    user: 用户id
    id: 电影id
    video: {
      src: 视频地址
      poster: 海报地址
      id: 视频id
    } 
    info: {
      name: 电影名称
      area: 地区
      director: 导演
      actor: 演员
      type: 类型
      time: 时间
      description: 描述
      language: 语言
    }
    image: {
      image: 截图地址,
      id: id
    }
  }
  获取电影发布 /movie get params: { currPage: 当前页, pageSize: 数量, id: 用户id }

                           |-|signout
                  |-|logon-|-|account

                          |-|daily
                          |-|swiper
                  |-|home-|-|hot
                          |-|rank
                          |-|notice
                          |-|special

      |--user    -|-|movie-|classify-|-|specDropList
      |                     
      |                   -|rank-|-|specDropList

                                   |-|simple
                                   |  
      |                   -|detail-|comment-|-|list
                                            |-|detail

                                           -|sort
                                           -|area
                                           -|actor
                                           -|director
      |                   -|search-|query-|-|lang
      |                           -|about
  api-|           |
      |           |-|setting-|info
      |           |
      |           |
      |           |
      |--customer-|-|message-|detail
                  |-|manage-|-|attention
                  |         |-|fans
                  |         |-|comment
                  |         |-|movie-|store
                  |                 -|browse
                  |
                  |
                  |       -|comment-|like
                  |       -|
                  |-|movie-|detail
                  |       -|rate
                  |       -|store

```js
__movie__

_global_
{
  notice: '跑马灯'
  info: '小程序信息',
  create_time: '时间'
}

_user_
{
  id: '主键id'
  avatar: '头像id'
  fans: ['粉丝id']
  attention: ['关注id']
  issue: ['发布id']
  glance: ['浏览电影id']
  comment: ['评论id']
  store: ['收藏电影']
  allow_many: '是否允许多地登录'
  create_time: '创建时间'
  modified_time: '修改时间'
  status: '账号状态'
}

_message_
{
  id: '主键id'
  user_info: {
    type: '用户类型[系统, 用户]'
    id: '用户id'
  }
  send_to: '发送的用户'
  content: {
    text: '文字描述'
    video: '视频'
    image: '图片'
  }
  readed: '是否已读'
  create_time: '时间'
}

_movie_
{
  id: '主键id'
  name: '电影名称'
  info: {
    name: '电影名称'
    description: '简介'
    actor: ['演员id']
    director: ['导演id']
    district: ['地区id']
    classify: ['分类id']
    screen_time: '上映时间'
    language: ['语言']
  }
  video: '视频id'
  images: ['图片id']
  poster: '海报'
  tag: ['标签id']
  comment: ['评论id']
  author: '作者id'
  glance: '浏览'
  author_description: '作者认为'
  author_rate: '作者评分'
  create_time: '发布时间'
  modified_time: '最后修改时间'
  store: ['收藏人的id']
  rate: ['评分']
  source_type: '文章来源[初始, 用户]',
  stauts: '电影状态(审核中，完成审核)'
}

_special_
{
  id: '主键id'
  movie: ['电影id']
  poster: '海报'
  description: '描述'
  name: '名称'
  create_time: '创建时间'
  modified_time: '修改时间'
}

_actor_
{
  id: '主键id'
  name: '名称'
  works: ['作品id']
  other: {
    alias: '别名'
    avatar: '图片'
  }
  create_time: '创建时间'
}

_director_
{
  id: '主键id'
  name: '名称'
  works: ['作品id']
  other: {
    alias: '别名'
  }
  create_time: '创建时间'
}

_district_
{
  id: '主键id'
  name: '名称'
  other: {}
  create_time: '创建时间'
}

_search_
{
  id: '主键id'
  key_word: '关键字'
  match: ['匹配作品']
  hot: '搜索次数'
  other: {}
  create_time: '创建时间'
}

_comment_
{
  id: '主键id'
  source: {
    type: ['movie', 'user']
    comment: '原始的电影或者用户的id'
  }
  user_info: '用户id'
  create_time: '创建时间'
  hot: '点赞'
  content: {
    text: '文字描述'
    video: ['视频id']
    image: ['图片id']
  }
  comment_users: ['评论用户id']
}

_rank_
{
  id: '主键id'
  name: '名称'
  other: {}
  create_time: '创建时间'
}

_classify_
{
  id: '主键id'
  name: '名称'
  other: {}
  create_time: '创建时间'
}

_video_
{
  id: '主键id'
  name: '名称'
  src: '视频地址'
  poster: '海报地址'
  create_time: '创建时间'
}

_image_
{
  id: '主键id'
  name: '名称'
  src: '地址'
  create_time: '创建时间'
}

```

搜索
电影发布修改
前端传递的媒体信息需要处理保存

个人信息
关注put 获取关注get 取消关注delete
评论 获取评论get
粉丝 获取粉丝get
浏览记录get
电影发布 获取get 发布put 修改post 
收藏 获取get

消息
发送 post
读取 put
删除delete
获取 get
电影获取 get
评分 put
收藏put 取消收藏delete
电影评论 post 用户评论
点赞 put 取消点赞delete