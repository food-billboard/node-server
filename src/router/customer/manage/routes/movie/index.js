const Router = require('@koa/router')
const Browse = require('./browser')
const Store = require('./store')
const { MongoDB, verifyTokenToData, isType, isEmpty } = require("@src/utils")

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
  //   classify: 类型
  //   screen_time: 时间
  //   description: 描述
  //   language: 语言,
  //   author_rate: 作者评分
  //   alias: ['别名']
  // }
  // images: {
  //   image: 截图地址,
  // }
// }

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
  rest: {
    actor: [],
    director: [],
    district: [],
    classify: [],
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

//空内容判断
function emptyCheck(target) {
  if(isEmpty(target)) return true
  if(isType(target, 'object')) {
    return Object.keys(target).some(key => {
      if(isType(target[key], 'number')) {
        return target[key] < 0
      }else if(isType(target[key], 'string')) {
        return !target[key].length
      }else if(isType(target[key], 'object') || isType(target[key], 'array')) {
        return emptyCheck(target[key])
      }
      return false
    })
  }
  if(isType(target, 'array')) {
    return target.some(t => emptyCheck(target))
  }
  return false
}

//自定义与系统字段内容区分
function fieldDefine(valid, unValid, target) {
  let newValid = { ...valid }
  let newUnValid = { ...unValid }
  Object.keys(target).forEach(key => {
    let _valid = []
    let _unValid = []
    if(valid[key] && unValid[key]) {
      if(isType(target[key], 'array')) {
        target[key].forEach(k => {
          if(mongo.isValid(k)) {
            _valid.push(k)
          }else {
            _unValid.push(k)
          }
        })
        newValid[key] = [..._valid]
        newUnValid[key] = [..._unValid]
      }else if(isType(target[key], 'object')) {
        const [__valid, __unValid] = fieldDefine(newValid[key], newUnValid[key], target[key])
        newValid[key] = __valid
        newUnValid = __unValid
      }else {
        if(mongo.isValid(target[key])) {
          newValid[key] = mongo.dealId(target[key])
        }else {
          newUnValid[key] = target[key]
        }
      }
    }
  })
  return [newValid, newUnValid]
}

router
.use(async(ctx, next) => {
  const { method, body } = ctx.request
  if(method.toLowerCase() === 'get') return await next()
  const {
    _id,
    info: {
      author_description,
      alias,
      ...nextInfo
    },
    ...nextBody
  } = body 
  let res

  //空数据判断
  if(emptyCheck({
    ...nextBody,
    info: { ...nextInfo }
  })) {
    ctx.status = 400
    ctx.body = JSON.stringify({
      success: false,
      res: {
        errMsg: '请求参数错误'
      }
    })
    return
  }

  //判断是否已经存在
  const data = await mongo.connect("movie")
  .then(db => db.findOne({

  }))
  .then(data => {
    if(data) return Promise.reject({errMsg: '存在相似内容', status: 400}) 
    return true
  })
  .catch(err => {
    if(err && err.status) {
      const { status, ...nextErr } = err
      ctx.status = status
      res = {
        success: false,
        res: {
          ...nextErr
        }
      }
    }else {
      ctx.status = 500
      res = {
        success: false,
        res: {
          errMsg: err
        }
      }
    }
    console.log(err)
    return false
  })

  if(data) {
    return await next()
  }
  ctx.body = JSON.stringify(res)

})
.post('/', async (ctx) => {
  const [, token] = verifyTokenToData(ctx)
  const { mobile }  = token
  let res
  let templateInsertData
  const { body } = ctx.request
  const { 
    video: {
      src,
      poster,
    },
    info: {
      name,
      author_rate,
      description,
      alias,
      author_description,
      screen_time,
      ...nextData
    },
    images
  } = body
  const {
    info,
    rest:originRest,
    ...nextTemplate
  } = TEMPLATE_MOVIE
  //自定义与系统自带字段分类
  const [valid, unValid] = fieldDefine({
    ...info,
    name,
    description,
    screen_time,
    alias: alias ? alias : [],
  }, {
    ...originRest
  }, { ...nextData })

  templateInsertData = {
    ...nextTemplate,
    info: {...valid},
    rest: { ...unValid },
    name,
    video: src,
    poster,
    images,
    author_rate,
    author_description: author_description ? author_description : description,
    create_time:Date.now(),
    modified_time: Date.now(),
  }
  const data = await mongo.connect("user")
  .then(db => db.findOne({
    mobile: Number(mobile)
  }, {
    projection: {
      _id: 1
    }   
  }))
  .then(data => {
    if(!data) return Promise.reject({errMsg: '登录过期', status: 401}) 
    const { _id } = data
    templateInsertData = {
      ...templateInsertData,
      author: _id
    }
    return mongo.connect("movie")
    .then(db => db.insertOne({...templateInsertData}))
  })
  .catch(err => {
    if(err && err.status) {
      const { status=400, ...nextErr } = err
      ctx.status = status
      res = {
        success: false,
        res: {
          ...nextErr
        }
      }
    }else {
      ctx.status = 500
      res = {
        success: false,
        res: {
          errMsg: err
        }
      }
    }
    console.log(err)

    return false
  })

  if(data) {
    res = {
      success: true,
      res: {
        errMsg: '审核中'
      }
    }
  }

  ctx.body = JSON.stringify(res)
})
.put('/', async (ctx) => {
  let res
  let templateUpdateData
  const { body: { 
    _id,
    video: {
      src,
      poster,
    }, 
    info: {
      name,
      author_description,
      author_rate,
      description,
      screen_time,
      ...nextInfo
    },
    images
  } } = ctx.request

  const mongoId = mongo.dealId(_id)

  const data = await mongo.connect("movie")
  .then(db => db.findOne({
    _id:mongoId
  }))
  .then(data => {
    if(!data) return Promise.reject({errMsg: '电影不存在', status: 400})
    const {
      info,
      author_description: origin_author_description,
      rest: originRest,
      ...nextData
    } = data

    //对用户自定义和系统自带字段进行区分
    const { alias: originAlias } = info
    const [valid, unValid] = fieldDefine({
      ...info,
      screen_time,
      alias: alias ? alias : originAlias,
      name,
      description,
    }, {
      ...originRest
    }, { ...nextInfo })

    //合成最终字段
    templateUpdateData = {
      ...nextData,
      name,
      video: src,
      poster,
      info: {...valid},
      rest: { ...unValid },
      images,
      author_rate,
      author_description: author_description ? author_description : origin_author_description
    }

    return mongo.connect("movie")
  })
  .then(db => db.updateOne({
    _id: mongo.dealId(_id)  
  }, {
    ...templateUpdateData
  }))
  .then(data => {
    if(data && data.result && data.result.nModified == 0) return Promise.reject({errMsg: '更新错误', status: 500})
    return true
  })
  .catch(err => {
    if(err && err.status) {
      const { status, ...nextErr } = err
      ctx.status = status
      res = {
        success: false,
        res: {
          ...nextErr
        }
      }
    }else {
      ctx.status = 500
      res = {
        success: false,
        res: {
          errMsg: err
        }
      }
    }
    console.log(err)
    return false
  })

  if(data) {
    res = {
      success: true,
      res: null
    }
  }

  ctx.body = JSON.stringify(res)
})
.get('/', async (ctx) => {
  const [, token] = verifyTokenToData(ctx)
  const { mobile } = token
  const { currPage=0, pageSize=30 } = ctx.query
  const data = await mongo.connect("user")
  .then(db => db.findOne({
    mobile: Number(mobile)
  }, {
    projection: {
      issue: 1
    }
  }))
  .then(data => {
    if(data && data.issue && !data.issue.length) return Promise.reject({err: null, data: []})
    const { issue } = data
    return mongo.connect("movie")
    .then(db => db.find({
      _id: { $in: [...issue] }
    }, {
      skip: pageSize * currPage,
      limit: pageSize,
      projection: {
        name: 1,
        poster: 1,
        hot: 1
      }
    }))
    .then(data => data.toArray()) 
  })
  .catch(err => {
    if(isType(err, 'object') && err.data) return err.data
    console.log(err)
    return false
  })

  if(!data) {
    console.log(data)
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
.use('/browser', Browse.routes(), Browse.allowedMethods())
.use('/store', Store.routes(), Store.allowedMethods())

module.exports = router