const Router = require('@koa/router')
const Day = require('dayjs')
const Browse = require('./browser')
const Store = require('./store')
const Detail = require('./detail')
const { 
  verifyTokenToData, 
  isType, 
  UserModel, 
  MovieModel, 
  DirectorModel, 
  ActorModel, 
  dealErr, 
  notFound, 
  Params,
  NUM_DAY,
  responseDataDeal,
  parseData,
  MOVIE_STATUS
} = require("@src/utils")
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

const TEMPLATE_MOVIE = {
  name: '',
  info: {
    name: '',
    description: '',
    actor: [],
    director: [],
    district: [],
    classify: [],
    screen_time: Date.now(),
    language: []
  },
  images: [],
  tag: [],
  comment: [],
  author_description: '',
  author_rate: '',
	store: [],
  total_rate: 0,
  rate_person: 1,
  source_type: 'USER',
	status: 'VERIFY',
	related_to: [],
	same_film: []
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
          same_type: 'SERIES'
        }
        if(name == same_film) {
          film.same_type = 'NAMESAKE'
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
          $push: { same_film: { film: _id, same_type: 'SERIES' } }
        }),
        MovieModel.updateMany({
          _id: { $in: [...namesake.map(n => n.film)] }
        }, {
          $push: { same_film: { film: _id, same_type: 'NAMESAKE' } }
        })
      ])
      //日志上传
      .catch(_=> {
        
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
          { author }
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
      
        let result = { film: _id, related_type: [] }
        if(director.length && director.some(d => {
          return originDirector.some(o => d.equals(o))
        })) {
          result.related_type.push('director')
        }
        if(actor.length && actor.some(a => {
          return originActor.some(o => a.equals(o))
        })) {
          result.related_type.push('actor')
        }
        if(classify.length && classify.some(c => {
          return originClassify.some(o => c.equals(o))
        })) { 
          result.related_type.push('classify')
        }
        if(originAuthor && author &&  originAuthor.equals(author)) {
          result.related_type.push('author')
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
          $push: { related_to: { film, related_type: type } }
        })
      }))
      //日志记录
      .catch(_ => {
        
      })
    })
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
      another_name,
      ...nextInfo
    },
  } = body 

  const check = Params.body(ctx, {
    name: 'info.name',
    validator: [
      data => typeof data === 'string'
    ]
  }, {
    name: 'info.district',
    validator: [
      data => Array.isArray(data) && data.every(item => ObjectId.isValid(item))
    ]
  }, {
    name: 'info.director',
    validator: [
      data => Array.isArray(data) && data.every(item => ObjectId.isValid(item))
    ]
  }, {
    name: 'info.actor',
    validator: [
      data => Array.isArray(data) && data.every(item => ObjectId.isValid(item))
    ]
  },
  {
    name: 'info.classify',
    validator: [
      data => Array.isArray(data) && data.every(item => ObjectId.isValid(item))
    ]
  },
  {
    name: 'info.language',
    validator: [
      data => Array.isArray(data) && data.every(item => ObjectId.isValid(item))
    ]
  }, {
    name: 'info.screen_time',
    validator: [
      data => {
        return Day(data).isValid() 
      }
    ]
  }, {
    name: 'info.description',
    validator: [
      data => typeof data === 'string' && data.length > 0 
    ]
  }, {
    name: 'info.author_rate',
    validator: [
      data => typeof +data === 'number' && +data >= 0 && +data <= 10
    ]
  }, {
    name: 'images',
    validator: [
      data => Array.isArray(data) && data.length >= 6 && data.every(d => ObjectId.isValid(d)),
    ]
  }, 
  {
    name: 'video.src',
    validator: [
      data =>  ObjectId.isValid(data)
    ]
  }, 
  {
    name: 'video.poster',
    validator: [
      data =>  ObjectId.isValid(data)
    ]
  }
  )

  if(check) return

  const {
    screen_time,
    name,
    director,
    actor
  } = nextInfo

  const validDirectorList = await DirectorModel.find({
    _id: { $in: [ director.filter(r => ObjectId.isValid(r)).map(d => ObjectId(d)) ] }
  })
  .select({
    _id: 1
  })
  .exec()
  .then(data => !!data && data)
  .then(data => data.map(d => d._id))
  .catch(err => {
    return []
  })
  const validActorList = await ActorModel.find({
    _id: { $in: [ actor.filter(a => ObjectId.isValid(a)).map(a => ObjectId(a)) ] }
  })
  .select({
    _id: 1
  })
  .exec()
  .then(data => !!data && data)
  .then(data => data.map(d => d._id))
  .catch(err => {
    return []
  })

  //判断是否已经存在
  const data = await MovieModel.findOne({
    //修改则需要跳过修改的电影id
    ...(!!_id ? { _id: { $nin: [ _id ] } } : {}),
    //名字类似
    $or: [
      { name },
      { name: { $in: [...another_name] } },
      { "info.another_name": { $in: [name] } }
    ],
    //上映时间类似
    $and: [ { "info.screen_time": { $gte: Day(screen_time).valueOf() - NUM_DAY(1) } }, { "info.screen_time": { $lte: Day(screen_time).valueOf() + NUM_DAY(1) } } ], 
    //导演类似
    ...(validDirectorList.length ? { "info.director": { $in: [ ...validDirectorList ] } } : {}),
    //演员类似
    ...(validActorList.length ? { "info.actor": { $in: [ ...validActorList ] } } : {}),
  })
  .select({
    _id: 1,
    name: 1
  })
  .exec()
  .then(parseData)
  .then(data => {
    if(data) return Promise.reject({ errMsg: '存在相类似的作品', status: 403 })
    return true
  })
  .catch(dealErr(ctx))

  if(data && !data.err) {
    return await next()
  }
  responseDataDeal({
    ctx,
    data
  })

})
.post('/', async (ctx) => {
  const [, token] = verifyTokenToData(ctx)
  let { id }  = token

  let templateInsertData
  const { body } = ctx.request
  const { 
    info: {
      name,
      author_rate,
      description,
      author_description,
      screen_time,
      ...nextData
    },
  } = body

  const [ images, video ] = Params.sanitizers(ctx.request.body, {
    name: 'images',
    sanitizers: [
      data => data.map(d => ObjectId(d))
    ]
  }, 
  {
    name: 'video',
    sanitizers: [
      data => Object.keys(data).reduce((acc, key) => {
        acc[key] = ObjectId(data[key])
        return acc
      }, {})
    ]
  })
  const {
    info,
    rest:originRest,
    ...nextTemplate
  } = TEMPLATE_MOVIE
  // //自定义与系统自带字段分类
  // const [valid, unValid] = fieldDefine({
  //   ...info,
  //   name,
  //   description,
  //   screen_time,
  //   another_name: alias ? alias : [],
  // }, 
  // {
  //   ...originRest
  // }, 
  // { ...Object.values(nextData).map(data => isType(data, 'array') ? data : [data]) })


  templateInsertData = {
    ...nextTemplate,
    info: {
      ...info,
      ...nextData,
      name,
      screen_time: Day(screen_time).toDate(),
      description
    },
    // rest: { ...unValid },
    name,
    video: video.src,
    poster: video.poster,
    images,
    author_rate,
    rate_pserson: 1,
    author_description: author_description ? author_description : description,
  }

  // const data = await UserModel.findOne({
  //   mobile: Number(mobile)
  // })
  // .select({
  //   _id: 1
  // })
  // .exec()
  // .then(data => !!data && data._doc)
  // .then(data => {
  //   if(!data) return Promise.reject({errMsg: '登录过期', status: 401}) 
  //   const { _id } = data
  //   templateInsertData = {
  //     ...templateInsertData,
  //     author: _id
  //   }
  // })
  // // .then(aboutFind(templateInsertData))
  // // .then(data => {
  // //   templateInsertData = {
  // //     ...templateInsertData,
  // //     ...data
  // //   }
  // // })

  const data = await Promise.resolve()
  .then(_ => {
    id = ObjectId(id)
    templateInsertData = {
      ...templateInsertData,
      author: ObjectId(id)
    }
    const movie = new MovieModel(templateInsertData)

    return  movie.save()
  })
  .then(data => {
    const { _id } = data
    if(_id) {
      return UserModel.updateOne({
        _id: id,
      }, {
        $addToSet: { issue: { _id: data._id, timestampes: Date.now() } }
      })
    }
    return Promise.reject({ errMsg: 'something error', status: 500 })
  })
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data,
    needCache: false
  })

})
.put('/', async (ctx) => {
  const check = Params.body(ctx, {
    name: '_id',
    validator: [
			data => ObjectId.isValid(data)
		]
  })
  if(check) return

  let templateUpdateData
  const { body: { 
    info: {
      name,
      author_description,
      author_rate,
      description,
      screen_time,
      ...nextInfo
    },
  } } = ctx.request
  const [, token] = verifyTokenToData(ctx)
  const { id } = token

  const [ _id, images, video ] = Params.sanitizers(ctx.request.body, {
    name: '_id',
    sanitizers: [
      data => ObjectId(data)
    ]
  }, {
    name: 'images',
    sanitizers: [
      data => data.map(d => ObjectId(d))
    ]
  }, {
    name: 'video',
    sanitizers: [
      data => Object.keys(data).reduce((acc, key) => {
        acc[key] = ObjectId(data[key])
        return acc
      }, {})
    ]
  })

  const data = await UserModel.findOne({
    _id: ObjectId(id),
    "issue._id": { $in: [ _id ] }
  })
  .select({
    _id: 1,
  })
  .exec()
  .then(parseData)
  .then(data => {
    if(!data) return Promise.reject({status: 403, errMsg: '非本人发布电影'})
  })
  .then(_ => {
    return MovieModel.findOne({
      _id
    })
    .select({
      info: 1,
      rest: 1,
      related_to: 1,
      same_film: 1
    })
    .exec()
  })
  .then(notFound)
  .then(async (data) => {

    const {
      info,
      // rest: originRest,
      related_to,
      same_film,
    } = data

    //对用户自定义和系统自带字段进行区分
    const { another_name: originAlias } = info
    // const [valid, unValid] = fieldDefine({
    //   ...info,
    //   screen_time,
    //   another_name: alias ? alias : originAlias,
    //   name,
    //   description,
    // }, {
    //   // ...originRest
    // }, { ...Object.values(nextInfo).map(info => isType(info, 'array') ? info : [info]) })

    //合成最终字段
    templateUpdateData = {
      related_to,
      same_film,
      name,
      video: video.src,
      poster: video.poster,
      info: {
        ...info,
        ...nextInfo
      },
      // rest: { ...unValid },
      images,
      ...(author_rate ? { author_rate } : {}),
      ...( author_description ? { author_description } : {} )
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
          $pull: { related_to: {film: _id} }
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
          $pull: { same_film: {film: _id} }
        })
      })
    }
  })
  // .then(_ => {
  //   return aboutFind(templateUpdateData)(_)
  // })
  // .then(data => {
  //   templateUpdateData = {
  //     ...templateUpdateData,
  //     ...data
  //   }
  // }) 
  .then(_ => {
    return MovieModel.updateOne({
      _id 
    }, {
      $set: {
        ...Object.keys(templateUpdateData).reduce((acc, key) => {
          acc = { ...acc, [key]: templateUpdateData[key] }
          return acc
        }, {})
      }
    })
  })
  .then(data => {
    if(data && data.nModified != 1) return Promise.reject({errMsg: '更新错误', status: 500})
    return true
  })
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data,
    needCache: false
  })
})
.get('/', async (ctx) => {
  const [, token] = verifyTokenToData(ctx)
  const { id } = token
  const [ currPage, pageSize ] = Params.sanitizers(ctx.query, {
    name: 'currPage',
    type: ['toInt'],
    _default: 0,
    sanitizers: [
      data => data >= 0 ? data : -1
    ]
  }, {
    name: 'pageSize',
    type: ['toInt'],
    _default: 30,
    sanitizers: [
      data => data >= 0 ? data : -1
    ]
  })

  const data = await MovieModel.aggregate([
    {
      $match: {
        author: ObjectId(id),
        status: MOVIE_STATUS.COMPLETE
      }
    },
    {
      $skip: currPage * pageSize
    },
    {
      $limit: pageSize
    },
    {
      $lookup: {
        from: 'classifies', 
        localField: 'info.classify', 
        foreignField: '_id', 
        as: 'info.classify'
      }
    },
    {
      $lookup: {
        from: 'users', 
        localField: 'author', 
        foreignField: '_id', 
        as: 'author'
      }
    },
    {
      $unwind: {
        path: "$author",
        preserveNullAndEmptyArrays: true 
      }
    },
    {
      $lookup: {
        from: 'images', 
        localField: 'poster', 
        foreignField: '_id', 
        as: 'poster'
      }
    },
    {
      $unwind: {
        path: "$poster",
        preserveNullAndEmptyArrays: true 
      }
    },
    {
      $lookup: {
        from: 'images', 
        localField: 'author.avatar', 
        foreignField: '_id', 
        as: 'author.avatar'
      }
    },
    {
      $unwind: {
        path: "$author.avatar",
        preserveNullAndEmptyArrays: true 
      }
    },
    {
      $project: {
        classify: "$info.classify.name",
        description: "$info.description",
        name: "$info.name",
        poster: "$poster.src",
        publish_time: "$info.screen_time",
        hot: 1,
        author: {
          _id: "$author._id",
          username: "$author.username",
          avatar: "$author.avatar.src"
        },
        rate: {
          $divide: [ "$total_rate", "$rate_person" ]
        }
      }
    }
  ])
  .then(data => {
    return {
      data: {
        issue: data
      }
    }
  })
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data
  })
})
.use('/browser', Browse.routes(), Browse.allowedMethods())
.use('/store', Store.routes(), Store.allowedMethods())
.use('/detail', Detail.routes(), Detail.allowedMethods())

module.exports = router