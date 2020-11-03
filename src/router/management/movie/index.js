const Router = require('@koa/router')
const Detail = require('./detail')
const { MovieModel, UserModel, dealErr, notFound, Params, responseDataDeal, MOVIE_STATUS, MOVIE_SOURCE_TYPE } = require('@src/utils')
const { Types: { ObjectId } } = require('mongoose')
const Day = require('dayjs')

const router = new Router()

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
      data => typeof data === 'undefined' ? MOVIE_STATUS : [ data ]
    ]
  }, {
    name: 'source_type',
    sanitizers: [
      data => typeof data === 'undefined' ? MOVIE_SOURCE_TYPE : [ data ]
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

})
//修改
.put('/', async(ctx) => {

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