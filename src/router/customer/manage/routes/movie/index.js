const Router = require('@koa/router')
const Browse = require('./browser')
const Store = require('./store')
const Detail = require('./detail')
const { verifyTokenToData, isType, isEmpty, dealMedia, UserModel, MovieModel, dealErr, notFound } = require("@src/utils")
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

const TEMPLATE_MOVIE = {
  name: '',
  info: {
    name: '',
    another_name: [],
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
  images: [],
  tag: [],
  comment: [],
  author_description: '',
  author_rate: '',
	store: [],
	rate: [],
  source_type: 'USER',
	stauts: 'VERIFY',
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
          if(ObjectId.isValid(k)) {
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
        if(ObjectId.isValid(target[key])) {
          newValid[key] = ObjectId(target[key])
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

    return MovieModel.find({
      name: { $regex: reg, $options: 'i' }
    })
    .select({
      _id: 1,
      name: 1
    })
    .exec()
    .then(data => !!data && data)
    .then(data => {
      let newSameFilm = []
      let series = []
      let namesake = []
      const { name } = _template
      data.forEach(d => {
        const { name: same_film, _id } = d
        let film = {
          film: _id,
          type: 'SERIES'
        }
        if(name == same_film) {
          film.type = 'NAMESAKE'
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
        MovieModel.updateMany({
          _id: { $in: [ ...series.map(s => s.film) ] }
        }, {
          $push: { same_film: { film: _id, type: 'SERIES' } }
        }),
        MovieModel.updateMany({
          _id: { $in: [...namesake.map(n => n.film)] }
        }, {
          $push: { same_film: { film: _id, type: 'NAMESAKE' } }
        })
      ])
      //日志上传
      .catch(_=> {
        console.log(_)
      })
    })
    //相关电影关联( 导演 演员 作者 分类 )
    .then(_ => {
      const {
        info: {
          director,
          classify,
          actor
        },
        author
      } = _template
      return MovieModel.find({
        $or: [
          { "info.director": { $in: [...director] } },
          { "info.classify": { $in: [...classify] } },
          { "info.actor": { $in: [...actor] } },
          {author}
        ]
      })
      .select({
        _id: 1,
        "info.director": 1,
        "info.actor": 1,
        "info.classify": 1,
        author: 1
      })
      .exec()
      .then(data => !!data && data)
      .then(notFound)
    })
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
          return originDirector.some(o => o.equals(d))
        })) {
          result.type.push('director')
        }
        if(actor.length && actor.some(a => {
          return originActor.some(o => o.equals(a))
        })) {
          result.type.push('actor')
        }
        if(classify.length && classify.some(c => {
          return originClassify.some(o => o.equals(c))
        })) { 
          result.type.push('classify')
        }
        if(originAuthor && author &&  originAuthor.equals(author)) {
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
        return MovieModel.updateOne({
          _id: film
        }, {
          $push: { related_to: { film, type } }
        })
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
  const data = await MovieModel.findOne({
    //名字类似
    $or: [
      { name },
      { name: { $in: [...alias] } },
      { "info.another_name": { $in: [name] } }
    ],
    //上映时间类似
    $and: [ { "info.screen_time": { $gte: screen_time - 24 * 60 * 60 * 1000 } }, { "info.screen_time": { $lte: screen_time + 24 * 60 * 60 * 1000 } } ], 
    //导演类似
    "info.director": { $in: [...director.filter(r => ObjectId.isValid(r)).map(d => ObjectId.dealId(d))] },
    //演员类似
    "info.actor": { $in: [...actor.filter(d => ObjectId.isValid(d)).map(d => ObjectId.dealId(d))] }
  })
  .select({
    _id: 1,
    name: 1
  })
  .exec()
  .then(data => !!data && data._doc)
  .then(notFound)
  .catch(dealErr(ctx))

  if(data && !data.err) {
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
    another_name: alias ? alias : [],
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
  }

  const data = await UserModel.findOne({
    mobile: Number(mobile)
  })
  .select({
    _id: 1
  })
  .exec()
  .then(data => !!data && data._doc)
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
    const movie = new MovieModel({
      ...templateInsertData
    })
    movie.save()
  })
  .catch(dealErr(ctx))

  if(data && data.err) {
    res = {
      ...data.res
    }
  }else {
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
  const [, token] = verifyTokenToData(ctx)
  const { mobile } = token

  const data = await UserModel.findOne({
    mobile: Number(mobile),
    issue: { $in: [ ObjectId(_id) ] }
  })
  .select({
    _id: 1
  })
  .exec()
  .then(data => !!data && data._doc)
  .then(data => {
    if(!data) return Promise.reject({statsu: 403, errMsg: '非本人发布电影'})
  })
  .then(_ => {
    return MovieModel.findOne({
      _id: ObjectId(_id)
    })
    .exec()
    .then(data => !!data && data._doc)
  })
  .then(async (data) => {
    if(!data) return Promise.reject({errMsg: '电影不存在', status: 400})

    const {
      info,
      author_description: origin_author_description,
      rest: originRest,
      ...nextData
    } = data

    //对用户自定义和系统自带字段进行区分
    const { another_name: originAlias } = info
    const [valid, unValid] = fieldDefine({
      ...info,
      screen_time,
      another_name: alias ? alias : originAlias,
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
      await Promise.all(related_to.filter(r => ObjectId.isValid(r.film))
      .map(relate => {
        const { film } = relate
        return MovieModel.updateOne({
          _id: typeof film === 'string' ? ObjectId(film) : film
        }, {
          $pull: { related_to: {film: ObjectId(_id)} }
        })
      }))
    }
    if(same_film.length) {
      await Promise.all(same_film.filter(r => ObjectId.isValid(r.film)))
      .map(same => {
        const { film } = same
        return MovieModel.updateOne({
          _id: typeof film === 'string' ? ObjectId(film) : film
        }, {
          $pull: { same_film: {film: ObjectId(_id)} }
        })
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
  .then(_ => {
    MovieModel.updateOne({
      _id: ObjectId(_id) 
    }, {
      ...Object.keys(templateUpdateData).reduce((acc, key) => {
        if(!acc.$set) acc.$set = {}
        acc.$set = { ...acc.$set, key: templateUpdateData[key] }
        return acc
      }, {})
    })
  })
  .then(data => {
    if(data && data.result && data.result.nModified == 0) return Promise.reject({errMsg: '更新错误', status: 500})
    return true
  })
  .catch(dealErr(ctx))

  if(data && data.err) {
    res = {
      ...data.res
    }
  }else {
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

  let res 

  const data = await UserModel.findOne({
    mobile: Number(mobile)
  })
  .select({
    issue: 1
  })
  .populate({
    path: 'issue',
    select: {
      name: 1,
      poster: 1,
      hot: 1
    },
    options: {
      skip: pageSize * currPage,
      limit: pageSize,
    }
  })
  .exec()
  .then(data => !!data && data._doc)
  .then(notFound)
  .then(data => {
    const { issue } = data
    return {
      issue: issue.map(is => {
        const { _doc: { poster: { src }, ...nextIs } } = is
        return {
          ...nextIs,
          poster: src,
        }
      })
    }
  })
  .catch(dealErr(ctx))

  if(data && data.dealErr) {
    res = {
      ...data.res
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