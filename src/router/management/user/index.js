const Router = require('@koa/router')
const Detail = require('./detail')
const { 
  UserModel, 
  verifyTokenToData, 
  dealErr, 
  VALIDATOR_MAP, 
  Params, 
  responseDataDeal, 
  ROLES_MAP, 
  USER_STATUS, 
  encoded, 
  EMAIL_REGEXP,
  initialUserData 
} = require('@src/utils')
const { Types: { ObjectId } } = require('mongoose')
const Day = require('dayjs')
const { Auth } = require('./auth')

const router = new Router()

const checkParams = (ctx, ...nextCheck) => {
  return Params.body(ctx, {
    name: 'mobile',
    validator: [
      data => /^1[3456789]\d{9}$/.test(data.toString())
    ]
  }, {
    name: 'password',
    validator: [data => typeof data === 'string' && data.length >= 8 && data.length <= 20]
  }, {
    name: 'email',
    validator: [data => EMAIL_REGEXP.test(data)]
  }, {
    name: 'username',
    validator: [
        data => typeof data === 'string' ? data.length > 0 && data.length <= 20 : typeof data === 'undefined'
    ]
  }, {
    name: 'description',
    validator: [
      data => typeof data === 'string' ? data.length > 0 && data.length <= 50 : typeof data === 'undefined'
    ]
  }, {
    name: 'avatar',
    validator: [
      data => typeof data === 'string' ? ObjectId.isValid(data) : typeof data === 'undefined'
    ]
  }, {
    name: 'roles',
    validator: [
      data => typeof data === 'string' ? data.split(',').every(item => Object.keys(ROLES_MAP).includes(item.trim().toUpperCase()))  : typeof data === 'undefined'
    ]
  }, ...nextCheck)
}

router
.get('/', async(ctx) => {

  const [ currPage, pageSize, roles, start_date, end_date, status ] = Params.sanitizers(ctx.query, {
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
    name: 'roles',
    sanitizers: [
      data => typeof data === 'string' ? [ data ] : Object.keys(ROLES_MAP)
    ]
  }, {
    name: 'start_date',
    sanitizers: [
      data => ((typeof data === 'string' && (new Date(data)).toString() == 'Invalid Date') || typeof data === 'undefined') ? undefined : Day(data).toDate()
    ]
  }, {
    name: 'end_date',
    sanitizers: [
      data => ((typeof data === 'string' && (new Date(data)).toString() == 'Invalid Date') || typeof data === 'undefined') ? Day().toDate() : Day(data).toDate()
    ]
  }, {
    name: 'status',
    sanitizers: [
      data => typeof data === 'string' ? [ data ] : USER_STATUS
    ]
  })
  const { query: { content='' } } = ctx

  const contentReg = {
    $regex: content,
    $options: 'ig'
  }

  const match = {
    createdAt: {
      $lte: end_date,
      ...(!!start_date ? { $gte: start_date } : {})
    },
    roles: {
      $in: roles
    },
    status: {
      $in: status
    },
    $or: [ 'username', 'email', 'mobile' ].map(item => ({ [item]: contentReg }))
  }

  const data = await Promise.all([
    //用户总数
    UserModel.aggregate([
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
    UserModel.aggregate([
      {
        $match: match
      },
      {
        $sort: {
          updatedAt: -1 
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
          from: 'images', 
          localField: 'avatar', 
          foreignField: '_id', 
          as: 'avatar'
        }
      },
      {
        $unwind: {
          path: "$avatar",
          preserveNullAndEmptyArrays: true 
        }
      },
      {
        $project: {
          createdAt: 1,
          updatedAt: 1,
          username: 1,
          mobile: 1,
          email: 1,
          hot: 1,
          status: 1,
          roles: 1,
          avatar: "$avatar.src",
          fans_count: {
            $size: {
              $ifNull: [
                "$fans",
                []
              ]
            }
          },
          attentions_count: {
            $size: {
              $ifNull: [
                "$attentions",
                []
              ]
            }
          },
          issue_count: {
            $size: {
              $ifNull: [
                "$issue",
                []
              ]
            }
          },
          comment_count: {
            $size: {
              $ifNull: [
                "$comment",
                []
              ]
            }
          },
          store_count: {
            $size: {
              $ifNull: [
                "$store",
                []
              ]
            }
          },
        }
      }
    ])
  ])
  .then(([total_count, user_data]) => {

    if(!Array.isArray(total_count) || !Array.isArray(user_data)) return Promise.reject({ errMsg: 'not found', status: 404 })
    return {
      data: {
        total: !!total_count.length ? total_count[0].total || 0 : 0,
        list: user_data
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
.use('/detail', Detail.routes(), Detail.allowedMethods())
//预查角色分配相关
.use(Auth)
//新增
.post('/', async(ctx) => {
  const check = checkParams(ctx)

  if(check) return

  let userModel = {}
  const [ roles ] = Params.sanitizers(ctx.request.body, {
    name: 'roles',
    sanitizers: [
      data => {
        return (typeof data === 'string') ? data.split(',') : ["USER"]
      }
    ]
  })
  const params = [ 'mobile', 'password', 'email', 'username', 'description', 'avatar', 'roles' ]
  const { request: { body } } = ctx
  const { mobile: newUserMobile, email } = body

  userModel = Object.keys(body).reduce((acc, cur) => {
    if(params.includes(cur)) {
      if(cur === 'roles') {
        acc.roles = roles
      }else if(typeof body[cur] != 'undefined') {
        acc[cur] = body[cur]
      }
    }
    return acc
  }, {})

  const [, token] = verifyTokenToData(ctx)
  const { id } = token

  const data = await UserModel.find({
    $or: [
      {
        mobile: Number(newUserMobile)
      },
      {
        email
      },
      {
        _id: ObjectId(id)
      }
    ]
  })
  .select({
    mobile: 1
  })
  .exec()
  .then(data => {
    if(data.length == 0) return Promise.reject({ status: 403, errMsg: 'forbidden' })
    if(data.length >= 2 || (data.length == 1 && data[0].mobile == Number(newUserMobile))) return Promise.reject({ status: 400, errMsg: 'user exists' }) 
    return initialUserData(userModel)
  })
  .then(data => ({ data: { _id: data._id } }))
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data,
    needCache: false
  })

})
//修改
.put('/', async(ctx) => {

  const check = Params.body(ctx, {
    name: '_id',
    validator: [
			data => ObjectId.isValid(data)
		]
  })

  if(check) return

  let editModel = {}
  const [ _id, roles ] = Params.sanitizers(ctx.request.body, {
    name: '_id',
    sanitizers: [
      data => ObjectId(data)
    ]
  }, {
    name: 'roles',
    sanitizers: [
      data => {
        if(typeof data === 'string') return data.split(',').map(item => item.trim())
        if(Array.isArray(data)) return data.map(item => item.toLowerCase())
        return false 
      }
    ]
  })
  const params = [ 'mobile', 'password', 'email', 'username', 'description', 'avatar', 'roles' ]
  const { request: { body } } = ctx

  editModel = Object.keys(body).reduce((acc, cur) => {
    if(params.includes(cur)) {
      if(cur == 'roles') {
        if(!!roles) acc.roles = roles
      }else if(cur === 'password') {
        if(VALIDATOR_MAP.password(body[cur])) acc[cur] = encoded(body[cur])
      }else if(cur == 'avatar') {
        if(VALIDATOR_MAP.objectId(body[cur])) acc[cur] = body[cur]
      }else if(typeof body[cur] != 'undefined') {
        acc[cur] = body[cur]
      }
    }
    return acc
  }, {})

  const data = await UserModel.updateOne({
    _id
  }, {
    $set: editModel
  })
  .then(data => {
    if(data.nModified == 0) return Promise.reject({ errMsg: 'not found', status: 404 })
    return {
      data: null
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

  const check = Params.query(ctx, {
    name: '_id',
    validator: [
      data => data.split(',').every(item => ObjectId.isValid(item))
    ]
  })

  if(check) return

  const [ _ids ] = Params.sanitizers(ctx.query, {
    name: '_id',
    sanitizers: [
      data => data.split(',').map(item => ObjectId(item))
    ]
  })

  const data = await UserModel.deleteMany({
    _id: { $in: _ids }
  })
  .then(data => {
    if(data.deletedCount != _ids.length) return Promise.reject({ errMsg: 'error', status: 404 })
    return {
      data: {
        _id: _ids
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