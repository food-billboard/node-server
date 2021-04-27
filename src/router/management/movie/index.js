const Router = require('@koa/router')
const Detail = require('./detail')
const { MovieModel, UserModel, verifyTokenToData, dealErr, notFound, Params, responseDataDeal, MOVIE_STATUS, MOVIE_SOURCE_TYPE, ROLES_MAP, findMostRole } = require('@src/utils')
const { Types: { ObjectId } } = require('mongoose')
const Day = require('dayjs')
const { Auth } = require('./auth')
const { sanitizersNameParams } = require('./utils')

const router = new Router()

//参数检查
const checkParams = (ctx, ...validator) => {
  return Params.body(ctx, {
    name: 'name',
    validator: [
      data => typeof data === 'string' && data.length > 0
    ]
  }, {
    name: 'alias',
    validator: [
      data => Array.isArray(data) && data.every(d => typeof d === 'string' && d.length > 0)
    ]
  }, {
    name: 'description',
    validator: [
      data => typeof data === 'string' && data.length > 0
    ]
  }, {
    name: "actor",
    validator: [
      data => Array.isArray(data) && !!data.length && data.every(d => ObjectId.isValid(d))
    ]
  }, {
    name: "director",
    validator: [
      data => Array.isArray(data) && !!data.length && data.every(d => ObjectId.isValid(d))
    ]
  }, {
    name: "district",
    validator: [
      data => Array.isArray(data) && !!data.length && data.every(d => ObjectId.isValid(d))
    ]
  }, {
    name: "classify",
    validator: [
      data => Array.isArray(data) && !!data.length && data.every(d => ObjectId.isValid(d))
    ]
  }, {
    name: "language",
    validator: [
      data => Array.isArray(data) && !!data.length && data.every(d => ObjectId.isValid(d))
    ]
  }, {
    name: 'screen_time',
    validator: [
      data => typeof data === 'string' && new Date(data).toString() != 'Invalid Date'
    ]
  }, {
    name: 'video',
    validator: [
      data => ObjectId.isValid(data)
    ]
  }, {
    name: 'images',
    validator: [
      data => Array.isArray(data) && data.length >= 6 && data.every(d => ObjectId.isValid(d))
    ]
  }, {
    name: 'poster',
    validator: [
      data => ObjectId.isValid(data)
    ]
  }, {
    name: 'author_rate',
    validator: [
      data => {
        const value = parseInt(data)
        return value >= 0 && value <= 10 
      }
    ]
  }, ...validator)
}

//参数处理
const sanitizersParams = (ctx, ...sanitizers) => {
  return Params.sanitizers(ctx.request.body, {
    name: 'actor',
    sanitizers: [
      data => data.map(d => ObjectId(d))
    ]
  }, {
    name: 'director',
    sanitizers: [
      data => data.map(d => ObjectId(d))
    ]
  }, {
    name: 'district',
    sanitizers: [
      data => data.map(d => ObjectId(d))
    ]
  }, {
    name: 'classify',
    sanitizers: [
      data => data.map(d => ObjectId(d))
    ]
  }, {
    name: 'language',
    sanitizers: [
      data => data.map(d => ObjectId(d))
    ]
  }, {
    name: 'screen_time',
    sanitizers: [
      data => Day(data).toDate()
    ]
  }, {
    name: 'video',
    sanitizers: [
      data => ObjectId(data)
    ]
  }, {
    name: 'images',
    sanitizers: [
      data => data.map(d => ObjectId(d))
    ]
  }, {
    name: 'poster',
    sanitizers: [
      data => ObjectId(data)
    ]
  }, {
    name: 'author_description',
    sanitizers: [
      data => typeof data === 'string' ? data.slice(0, 30) : ''
    ]
  }, {
    name: 'author_rate',
    sanitizers: [
      data => parseInt(data)
    ]
  }, ...sanitizers)
}

router
//搜索(筛选)-分类-日期-状态-来源分类(系统、用户)-id(可多个)
.get('/', async(ctx) => {

  const [ currPage, pageSize, classify, status, source_type, end_date, start_date ] = Params.sanitizers(ctx.query, {
    name: 'currPage',
    _default: 0,
    sanitizers: [
      data => data >= 0 ? +data : 0
    ]
  }, {
    name: 'pageSize',
    _default: 30,
    sanitizers: [
      data => data >= 0 ? +data : 30
    ]
  }, {
    name: 'classify',
    sanitizers: [
      data => typeof data === 'string' && ObjectId.isValid(data) ? ObjectId(data) : undefined
    ]
  }, {
    name: 'status',
    sanitizers: [
      data => typeof data === 'undefined' ? Object.keys(MOVIE_STATUS) : [ data ]
    ]
  }, {
    name: 'source_type',
    sanitizers: [
      data => typeof data === 'undefined' ? Object.keys(MOVIE_SOURCE_TYPE) : [ data ]
    ]
  }, {
    name: 'end_date',
    sanitizers: [
      data => ((typeof data === 'string' && (new Date(data)).toString() == 'Invalid Date') || typeof data === 'undefined') ? Day().toDate() : Day(data).toDate()
    ]
  }, {
    name: 'start_date',
    sanitizers: [
      data => ((typeof data === 'string' && (new Date(data)).toString() == 'Invalid Date') || typeof data === 'undefined') ? undefined : Day().toDate()
    ]
  })
  const { query: { content='', _id } } = ctx

  const contentMatch = sanitizersNameParams(content)
  
  let match = {
    source_type: {
      $in: source_type
    },
    status: {
      $in: status
    },
    createdAt: {
      $lte: end_date,
      ...(!!start_date ? { $gte: start_date } : {})
    },
    ...contentMatch,
  }

  if(!!classify) {
    match = { 
      ...match,
      "info.classify": {
        $in: [ classify ]
      },
    }
  }
  if(typeof _id === 'string' && !!_id) {
    const ids = _id.split(',').reduce((acc, cur) => {
      if(ObjectId.isValid(cur.trim())) acc.push(ObjectId(cur))
      return acc 
    }, [])
    if(ids.length) match._id = { $in: ids }
  }

  const data = await Promise.all([
    //总数
    MovieModel.aggregate([
      {
        $match: match
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: 1
          }
        }
      }
    ]),
    MovieModel.aggregate([
      {
        $match: match
      },
      {
        $skip: currPage * pageSize
      },  
      {
        $limit: pageSize
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
        $unwind: "$author"
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
        $project: {
          name: 1,
          author: {
            _id: "$author._id",
            username: "$author.username"
          },
          poster: "$poster.src",
          createdAt: 1,
          updatedAt: 1,
          glance: 1,
          hot: 1,
          rate_person: 1,
          total_rate: 1,
          source_type: 1,
          status: 1,
          description: "$info.description",
          comment_count: {
            $size: {
              $ifNull: [
                "$comment", []
              ]
            }
          },
          tag_count: {
            $size: {
              $ifNull: [
                "$tag", []
              ]
            }
          },
          barrage_count: {
            $size: {
              $ifNull: [
                "$barrage", []
              ]
            }
          }
        }
      }
    ])
  ])
  .then(([total_count, movie_data]) => {

    if(!Array.isArray(total_count) || !Array.isArray(movie_data)) return Promise.reject({ errMsg: 'data error', status: 404 })
    return {
      data: {
        total: total_count.length ? total_count[0].total || 0 : 0,
        list: movie_data
      }
    }
  })
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data,
    needCachme: false
  })
})
.use('/detail', Detail.routes(), Detail.allowedMethods())
//权限判断
.use(Auth)
//新增
.post('/', async(ctx) => {

  const check = checkParams(ctx)
  if(check) return

  const [
    actor,
    director,
    district,
    classify,
    language,
    screen_time,
    video,
    images,
    poster,
    author_description,
    author_rate
  ] = sanitizersParams(ctx)

  const { body: { name, alias, description } } = ctx.request
  const [, token] = verifyTokenToData(ctx)
  const { id } = token

  const data = await UserModel.findOne({
    _id: ObjectId(id)
  })
  .select({
    _id: 1,
    roles: 1
  })
  .exec()
  .then(notFound)
  .then(({ _id, roles }) => {

    const role = findMostRole(roles)

    const model = new MovieModel({
      name,
      info: {
        name,
        another_name: alias,
        description,
        actor,
        director,
        district,
        classify,
        language,
        screen_time,
      },
      poster,
      video,
      images,
      author: _id,
      author_description,
      author_rate,
      source_type: role == ROLES_MAP.SUPER_ADMIN ? MOVIE_SOURCE_TYPE.ORIGIN : MOVIE_SOURCE_TYPE.USER,
      status: MOVIE_STATUS.VERIFY
    })
    return model.save()
  })
  .then(data => !!data && data._id)
  .then(notFound)
  .then(data => ({ data: { _id: data } }))
  .catch(dealErr(ctx))
  

  responseDataDeal({
    ctx,
    data,
    needCache: false
  })
  
})
//修改
.put('/', async(ctx) => {

  const check = checkParams(ctx)
  if(check) return

  const [
    actor,
    director,
    district,
    classify,
    language,
    screen_time,
    video,
    images,
    poster,
    author_description,
    author_rate,
    _id
  ] = sanitizersParams(ctx, {
    name: '_id',
    sanitizers: [
      data => ObjectId(data)
    ]
  })

  const { body: { name, alias, description } } = ctx.request

  const data = await MovieModel.updateOne({
    _id
  }, {
    $set: {
      name,
      info: {
        name,
        another_name: alias,
        description,
        actor,
        director,
        district,
        classify,
        screen_time,
        language
      },
      video,
      poster,
      images,
      author_description,
      author_rate
    }
  })
  .then(data => { 
    if(data.nModified == 0) return Promise.reject({ errMsg: 'not Found', status: 404 })
    return {
      data: {
        _id
      }
    }
  })
  .catch(dealErr(ctx))
  
  responseDataDeal({
    ctx,
    data,
    needCache: false
  })

})
//删除
.delete('/', async(ctx) => {

  const [ _ids ] = Params.sanitizers(ctx.query, {
    name: '_id',
    sanitizers: [
      data => data.split(',').map(item => ObjectId(item.trim()))
    ]
  })

  const data = await MovieModel.deleteMany({
    _id: { $in: _ids }
  })
  .then(_ => ({ data: _ids }))
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data,
    needCache: false
  })

})
//详情
.get('/edit', async(ctx) => {

  const check = Params.query(ctx, {
    name: '_id',
    validator: [
      data => ObjectId.isValid(data)
    ]
  })

  if(check) return

  const [ _id ] = Params.sanitizers(ctx.query, {
    name: '_id',
    sanitizers: [
      data => ObjectId(data)
    ]
  })

  const data = await MovieModel.findOne({
    _id
  })
  .select({
    name: 1,
    info: 1,
    video: 1,
    images: 1,
    poster: 1,
    author_description: 1,
    author_rate: 1,
  })
  .exec()
  .then(notFound)
  .then(data => {
    const { info: { another_name: alias, ...nextInfo }, images, poster, video, ...nextData } = data

    return {
      data: {
        ...nextData,
        ...nextInfo,
        poster: poster ? poster._id : null,
        video: video ? video._id : null,
        images: images.map(item => item && item._id),
        alias
      }
    }
  })
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data,
    needCache: false
  })

})

module.exports = router