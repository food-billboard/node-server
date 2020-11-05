const Router = require('@koa/router')
const Detail = require('./detail')
const { MovieModel, UserModel, verifyTokenToData, dealErr, notFound, Params, responseDataDeal, MOVIE_STATUS, MOVIE_SOURCE_TYPE, ROLES_MAP, findMostRole } = require('@src/utils')
const { Types: { ObjectId } } = require('mongoose')
const Day = require('dayjs')

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
      data => Array.isArray(data) && data.length == 6 && data.every(d => ObjectId.isValid(d))
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
  return Params.sanitizers(ctx.body, {
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
      data => typeof data === 'string' ? data.length > 30 > data.slice(0, 30) : ''
    ]
  }, {
    name: 'author_rate',
    sanitizers: [
      data => parseInt(data)
    ]
  }, ...sanitizers)
}

//获取最高角色
const getRoles = (roles) => {
  let role = 99
  roles.forEach(item => {
    if(ROLES_MAP[item] < role) {
      role = ROLES_MAP[item]
    }
  })
  return role
}

router
//搜索(筛选)-分类-日期-状态-来源分类(系统、用户)
.get('/', async(ctx) => {

  const [ currPage, pageSize, classify, status, source_type, end_date, start_date ] = Params.sanitizers(ctx.query, {
    name: 'currPage',
    _default: 0,
    sanitizers: [
      data => data >= 0 ? data : 0
    ]
  }, {
    name: 'pageSize',
    _default: 30,
    sanitizers: [
      data => data >= 0 ? data : 30
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
  const { query: { content='' } } = ctx

  const reg = {
    $regex: content,
    $options: 'gi'
  }
  
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
    $or: [
      {
        name: reg
      },
      {
        "info.description": reg
      },
      {
        "info.author_description": reg
      },
    ]
  }

  if(!!classify) {
    match = { 
      ...match,
      "info.classify": {
        $in: [ classify ]
      },
    }
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
      // {
      //   $sort: {

      //   }
      // },
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
        $project: {
          name: 1,
          author: {
            _id: "$author._id",
            username: "$author.username"
          },
          createdAt: 1,
          updatedAt: 1,
          glance: 1,
          hot: 1,
          rate_person: 1,
          total_rate: 1,
          source_type: 1,
          stauts: 1,
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
      // {
      //   data: {
      //     total,
      //     list: [
      //       {
      //         _id
      //         name
      //         author
      //         createdAt
      //         updatedAt
      //         glance
      //         hot
      //         rate_person
      //         total_rate
      //         source_type
      //         stauts
      //         comment_count,
      //         tag_count,
      //         barrage_count
      //       }
      //     ]
      //   }
      // }
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
.use(async (ctx, next) => {
  const { request: { method } } = ctx
  const _method = method.toLowerCase()

  if(_method === 'post') return await next()

  const [ , token ] = verifyTokenToData(ctx)
  const { mobile } = token

  let _id
  let movieData

  try {
    _id = _method == 'put' ? ctx.request.body._id : ctx.query._id
  }catch(err) {}

  const data = MovieModel.findOne({
    _id
  })
  .select({
    source_type: 1,
    author: 1
  })
  .exec()
  .then(data => !!data && data._doc)
  .then(data => {
    if(!data) return Promise.reject({ errMsg: 'not found', status: 404 })

    movieData = data
    const { author } = data

    let query = {
      $or: [
        {
          _id: author
        },
        {
          mobile: Number(mobile)
        }
      ]
    }

    return UserModel.find(query)
    .select({
      _id: 1,
      roles: 1,
      mobile
    })
    .exec()
  })
  .then(data => !!data && !!data.length)
  .then(notFound)
  .then(data => {
    if(data.length == 1) {
      if(data[0].mobile != mobile) return Promise.reject({ errMsg: 'not found', status: 404 })
    }else {
      let manageRoles
      let userRoles 
      const { author, source_type } = movieData
      //查找对应的用户
      data.forEach(item => {
        const { mobile: _mobile, _id, roles } = item
        if(mobile == _mobile) {
            manageRoles = roles
        }else if(_id.equals(author)) {
            userRoles = roles
        }
      })

      const maxManageRole = findMostRole(manageRoles)
      const maxUserRole = findMostRole(userRoles)

      //权限判断
      if(source_type === 'ORIGIN') {
        if(maxManageRole > ROLES_MAP.SUPER_ADMIN) {
            return false
        }
      }else {
        if(maxManageRole >= maxUserRole) {
            return false
        }
      }
    }
    return true
  })
  .then(data => {
    if(!data) return Promise.reject({ errMsg: 'forbidden', status: 403 })
  })
  .catch(dealErr(ctx))

  if(!data) return await next()

  responseDataDeal({
    ctx,
    data,
    needCache: false
  })

})
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
  ] = sanitizers(ctx)

  const { body: { name, alias, description } } = ctx.request
  const [, token] = verifyTokenToData(ctx)
  const { mobile } = token

  const data = await UserModel.findOne({
    mobile: Number(mobile)
  })
  .select({
    _id: 1,
    roles: 1
  })
  .exec()
  .then(data => !!data && data._doc)
  .then(notFound)
  .then(({ _id, roles }) => {

    const role = getRoles(roles)

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
      source_type: 'USER',
      status: role == ROLES_MAP.SUPER_ADMIN ? MOVIE_SOURCE_TYPE.ORIGIN : MOVIE_SOURCE_TYPE.USER
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

  const [ _id ] = Params.sanitizers(ctx.query, {
    name: '_id',
    sanitizers: [
      data => ObjectId(data)
    ]
  })

  const data = await MovieModel.deleteOne({
    _id
  })
  .then(_ => ({ data: _id }))
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data,
    needCache: false
  })

})


module.exports = router