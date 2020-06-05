const Router = require('@koa/router')
const Browse = require('./browser')
const Store = require('./store')
const Detail = require('./detail')
const { MongoDB, verifyTokenToData, isType, isEmpty, dealMedia } = require("@src/utils")

const router = new Router()
const mongo = MongoDB()

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
      return emptyCheck(target[key])
    })
  }else if(isType(target, 'array')) {
    return target.some(t => emptyCheck(t))
  }else if(isType(target, 'number')) {
    return target < 0
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

function aboutFind(template) {
  return (_) => {
    let _template = { ...template }
    return mongo.connect("movie")
    .then(db => {
      let reg
      const {
        name
      } = _template
      const isReg = str => /\d/g.test(str) ? `[${str}]?` : str
      if(name.length == 1) {
        reg = name
      }else if(name.length == 2) {
        reg = `${name.slice(0, name.length - 1)}${isReg(name.slice(name.length - 1))}`
      }else {
        reg = `${name.slice(0, name.length - 2)}${isReg(name.slice(name.length - 2, name.length - 1))}${isReg(name.slice(name.length - 1))}`
      }
      return db.find({
        name: { $regex: reg, $options: 'i' }
      }, {
        projection: {
          _id: 1,
          name: 1
        }
      })
    })
    .then(data => data.toArray())
    .then(data => {
      let newSameFilm = []
      let series = []
      let namesake = []
      const { name } = _template
      data.forEach(d => {
        const { name: same_film, _id } = d
        let film = {
          film: _id,
          type: 'series'
        }
        if(name == same_film) {
          film.type = 'namesake'
          namesake.push(film)
        }else {
          series.push(film)
        }
        newSameFilm.push(film)
      })
      //合并入模板内容
      _template = {
        ..._template,
        same_film: [...newSameFilm]
      }
      return {
        series,
        namesake
      }
    })
    .then(({series, namesake}) => {
      const {
        _id
      } = _template
      if(!_id) return
      return Promise.all([
        mongo.connect("movie")
        .then(db => db.updateMany({
          _id: { $in: [...series.map(s => s.film)] }
        }, {
          $push: { same_film: { film: _id, type: 'series' } }
        })),
        mongo.connect("movie")
        .then(db => db.updateMany({
          _id: { $in: [...namesake.map(n => n.film)] }
        }, {
          $push: { same_film: { film: _id, type: 'namesake' } }
        }))
      ])
      //日志上传
      .catch(_=> {
        console.log(_)
      })
    })
    //相关电影关联( 导演 演员 作者 分类 )
    .then(_ => mongo.connect("movie"))
    .then(db => {
      const {
        info: {
          director,
          classify,
          actor
        },
        author
      } = _template
      return db.find({
        $or: [
          { "info.director": { $in: [...director] } },
          { "info.classify": { $in: [...classify] } },
          { "info.actor": { $in: [...actor] } },
          {author}
        ]
      }, {
      projection: {
        _id: 1,
        "info.director": 1,
        "info.actor": 1,
        "info.classify": 1,
        author: 1
      }
    })})
    .then(data => data.toArray())
    .then(data => {
      let newRelatedTo = []
      const { author: originAuthor, info: {
        classify: originClassify,
        director: originDirector,
        actor: originActor
      } } = _template
      data.forEach(d => {
        const { 
          _id,
          info: {
            director,
            actor,
            classify
          },
          author
        } = d
        let result = { film: _id, type: [] }
        if(director.length && director.some(d => {
          return originDirector.some(o => mongo.equalId(o, d))
        })) {
          result.type.push('director')
        }
        if(actor.length && actor.some(a => {
          return originActor.some(o => mongo.equalId(o, a))
        })) {
          result.type.push('actor')
        }
        if(classify.length && classify.some(c => {
          return originClassify.some(o => mongo.equalId(o, c))
        })) { 
          result.type.push('classify')
        }
        if(originAuthor && author &&  mongo.equalId(originAuthor, author)) {
          result.type.push('author')
        }
        newRelatedTo.push(result)
      })  
      //合并入模板内容
      _template = {
        ..._template,
        related_to: [...newRelatedTo]
      }
      return newRelatedTo
    })
    //反向关联
    .then(data => {
      const {
        _id
      } = _template
      if(!_id) return
      return Promise.all(data.map(d => {
        const { film, type } = d
        return mongo.connect("movie")
        .then(db => db.updateOne({
          _id: film
        }, {
          $push: { related_to: { film, type } }
        }))
      }))
      //日志记录
      .catch(_ => {
        console.log(_)
      })
    })
    //媒体内容处理
    // .then(_ => {
    //   const {
    //     images:mediaImages,
    //     video:mediaVideo,
    //     poster:mediaPoster,
    //   } = templateInsertData
  
    //   dealMedia()
    // })
    .then(_ => _template)
  }
}

// function dealObject2Mongo(target) {
//   let obj = {}
//   Object.keys(target).forEach(key => {
//     if(Array.isArray(target[key])) {
//       if(!obj.$addToSet) obj.$addToSet = {}
//       obj.$addToSet = { ...obj.$addToSet, key: [ ...target[key] ] }
//     }
//     else if(isType(target[key], 'object')) {

//     }
//     else {
//       if(!obj.$set) obj.$set = {}
//       obj.$set = { ...obj.$set, key: target[key] }
//     }
//   })
// }

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

  const {
    screen_time,
    name,
    director,
    actor
  } = nextInfo
  //判断是否已经存在
  const data = await mongo.connect("movie")
  .then(db => db.findOne({
    //名字类似
    $or: [
      { name },
      { name: { $in: [...alias] } },
      { "info.alias": { $in: [name] } }
    ],
    //上映时间类似
    $and: [ { "info.screen_time": { $gte: screen_time - 24 * 60 * 60 * 1000 } }, { "info.screen_time": { $lte: screen_time + 24 * 60 * 60 * 1000 } } ], 
    //导演类似
    "info.director": { $in: [...director.filter(r => mongo.isValid(r)).map(d => mongo.dealId(d))] },
    //演员类似
    "info.actor": { $in: [...actor.filter(d => mongo.isValid(d)).map(d => mongo.dealId(d))] }
  }, {
    projection: {
      _id: 1,
      name: 1
    }
  }))
  .then(data => {
    if(data) {
      return Promise.reject({errMsg: '存在相似内容', status: 400, data: {...data}}) 
    }
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
  }, { ...Object.values(nextData).map(data => isType(data, 'array') ? data : [data]) })

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

  const data = await  mongo.connect("user")
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
  })
  .then(aboutFind(templateInsertData))
  .then(data => {
    templateInsertData = {
      ...templateInsertData,
      ...data
    }
  })
  .then(_ => {
    //将完整数据存入数据库
    return mongo.connect("movie")
  })
  .then(db => db.insertOne({...templateInsertData}))
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
        data: '审核中'
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
      alias,
      ...nextInfo
    },
    images
  } } = ctx.request
  const mongoId = mongo.dealId(_id)
  const [, token] = verifyTokenToData(ctx)
  const { mobile } = token

  const data = await mongo.connect("user")
  .then(db => db.findOne({
    mobile: Number(mobile),
    issue: { $in: [mongoId] }
  }, {
    projection: {
      _id: 1
    }
  }))
  .then(data => {
    if(!data) return Promise.reject({statsu: 403, errMsg: '非本人发布电影'})
  })
  .then(_ => mongo.connect("movie"))
  .then(db => db.findOne({
    _id:mongoId
  }))
  .then(async (data) => {
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
    }, { ...Object.values(nextInfo).map(info => isType(info, 'array') ? info : [info]) })
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
      author_description: author_description ? author_description : origin_author_description,
      modified_time: Date.now()
    }
  })
  .then(async(_) => {
    const {
      related_to,
      same_film
    } = templateUpdateData
    //取消之前的电影关联
    if(related_to.length) {
      await Promise.all(related_to.filter(r => mongo.isValid(r.film))
      .map(relate => {
        const { film } = relate
        return mongo.connect("movie")
        .then(db => db.updateOne({
          _id: typeof film === 'string' ? mongo.dealId(film) : film
        }, {
          $pull: { related_to: {film: mongoId} }
        }))
      }))
    }
    if(same_film.length) {
      await Promise.all(same_film.filter(r => mongo.isValid(r.film)))
      .map(same => {
        const { film } = same
        return mongo.connect("movie")
        .then(db => db.updateOne({
          _id: typeof film === 'string' ? mongo.dealId(film) : film
        }, {
          $pull: { same_film: {film: mongoId} }
        }))
      })
    }
  })
  .then(_ => {
    return aboutFind(templateUpdateData)(_)
  })
  .then(data => {
    templateUpdateData = {
      ...templateUpdateData,
      ...data
    }
    return Promise.reject()
  }) 
  .then(_ => mongo.connect("movie"))
  .then(db => db.updateOne({
    _id: mongo.dealId(_id)  
  }, {
    ...Object.keys(templateUpdateData).reduce((acc, key) => {
      if(!acc.$set) acc.$set = {}
      acc.$set = { ...acc.$set, key: templateUpdateData[key] }
      return acc
    }, {})
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
.use('/detail', Detail.routes(), Detail.allowedMethods())

module.exports = router