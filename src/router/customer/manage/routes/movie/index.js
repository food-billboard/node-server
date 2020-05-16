const Router = require('@koa/router')
const Browse = require('./browse')
const Store = require('./store')
const { MongoDB, verifyTokenToData, withTry } = require("@src/utils")

const router = new Router()
const mongo = MongoDB()

// 发布电影data: { 
  // video: {
  //   src: 视频地址
  //   poster: 海报地址
  // } 
  // info: {
  //   name: 电影名称
  //   area: 地区
  //   director: 导演
  //   actor: 演员
  //   type: 类型
  //   time: 时间
  //   description: 描述
  //   language: 语言
  // }
  // image: {
  //   image: 截图地址,
  // }
// }
// 修改电影data: { 
  // id: 电影id
  // video: {
  //   src: 视频地址
  //   poster: 海报地址
  //   id: 视频id
  // } 
  // info: {
  //   name: 电影名称
  //   area: 地区
  //   director: 导演
  //   actor: 演员
  //   type: 类型
  //   time: 时间
  //   description: 描述
  //   language: 语言
  // }
  // image: {
  //   image: 截图地址,
  //   id: id
  // }
// }
// 获取params: { currPage: 当前页, pageSize: 数量 }

const TEMPLATE_MOVIE = {
  name: '',
  info: {
    name: '',
    alias: [],
    description: '',
    actor: [],
    director: [],
    district: [],
    classify: [],
    screen_time: Date.now(),
    language: []
  },
  video: '',
  images: [],
  poster: '',
  tag: [],
  comment: [],
  author: '',
	glance: 0,
  author_description: '',
  author_rate: '',
  create_time: Date.now(),
  modified_time: Date.now(),
	store: [],
	hot: 0,
	rate: [],
	total_rate: 0,
  source_type: 'user',
	stauts: 'verify',
	related_to: [],
	same_film: []
}


router
.put('/', async (ctx) => {
  ctx.body = '发布电影'
  const [, token] = verifyTokenToData(ctx)
  const { mobile }  = token
  let res
  const { body: { 
    video: {
      src,
      poster
    }, 
    info: {
      name,
      time,
      ...nextInfo
    },
    image: {
      image
    }
  } } = ctx.request
  const data = await withTry(mongo.find)("_movie_", {
    $or: [
      {
        "info.name": name,
      },
      {
        "info.alias": { $all: [name] }
      }
    ],
    "info.screen_time": time
  }, {
    _id: 1
  })

  // .then(data => {
  //   if(data.length) {
  //     return []
  //   }else {
  //     return mongo.findOne("_user_", {mobile}, {_id: 1})
  //     mongo.insert("_movie_", {
  //       name,
  //       info: {
  //         name: '电影名称'
  //         alias: ['别名']
  //         description: '简介'
  //         actor: ['演员id']
  //         director: ['导演id']
  //         district: ['地区id']
  //         classify: ['分类id']
  //         screen_time: '上映时间'
  //         language: ['语言']
  //       }
  //       video: '视频id'
  //       images: ['图片id']
  //       poster: '海报'
  //       tag: ['标签id']
  //       comment: ['评论id']
  //       author: '作者id'
  //       glance: '浏览'
  //       author_description: '作者认为'
  //       author_rate: '作者评分'
  //       create_time: '发布时间'
  //       modified_time: '最后修改时间'
  //       store: ['收藏人的id']
  //       hot: '收藏人数'
  //       rate: ['评分']
  //       total_rate: '综合评分'
  //       source_type: '文章来源[初始, 用户]',
  //       stauts: '电影状态(审核中，完成审核)'
  //       related_to: ['电影相关']
  //       same_film: [{
  //         film: '相同电影名称',
  //         type: '系列或同名'
  //       }]
  //     })
  //   }
  // })
  // .catch(err => {
  //   console.log(err)
  //   return false
  // })

  if(!data) {
    ctx.body = 500
    res = {
      success: false,
      res: null
    }
  }else {
    if(!data.length) {
      res = {
        success: true,
        res: null
      }
    }else {
      ctx.status = 403
      res = {
        success: false,
        res: {
          errMsg: '内容已存在'
        }
      }
    }
  }

  ctx.body = JSON.stringify(res)
})
.post('/', async (ctx) => {
  ctx.body = '修改电影'
  let res
  const { body: { 
    _id,
    video: {
      src,
      poster,
      id:videoId
    }, 
    info: {
      name,
      area,
      director,
      actor,
      type,
      time,
      description,
      language,
    },
    image: {
      image,
      id:imageId,
    }
  } } = ctx.request

  const [, data] = await withTry(mongo.updateOne)("_movie_", {
    _id: mongo.dealId(_id)
  }, {
    
  })

  ctx.body = JSON.stringify(res)
})
.get('/', async (ctx) => {
  const [, token] = verifyTokenToData(ctx)
  const { mobile } = token
  const { currPage=0, pageSize=30 } = ctx.query
  const data = await mongo.findOne("_user_", {
    mobile,
    query: [ [ "limit", pageSize ], [ "skip", pageSize * currPage ] ]
  }, {
    issue: 1
  })
  .then(data => {
    const { issue } = data
    return mongo.find("_movie_", {
      _id: { $in: [...issue] }
    }, {
      info: 1,
      poster: 1,
      hot: 1
    })  
  })
  .catch(err => {
    console.log(err)
    return false
  })

  if(!data) {
    res = {
      success: false,
      res: null
    }
  }else {
    res = {
      success: true,
      res: {
        data
      }
    }
  }
  ctx.body = JSON.stringify(res)
})
.use('/browse', Browse.routes(), Browse.allowedMethods())
.use('/store', Store.routes(), Store.allowedMethods())

module.exports = router