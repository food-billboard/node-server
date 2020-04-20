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