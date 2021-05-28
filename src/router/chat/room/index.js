const Router = require('@koa/router')
const { Types: { ObjectId } } = require('mongoose')
const { verifyTokenToData, RoomModel, dealErr, Params, responseDataDeal, ROOM_TYPE, parseData, MemberModel,  } = require('@src/utils')
const joinRoom = require('./utils/join')

const router = new Router()

router
.get('/', async(ctx) => {

  const [ currPage, pageSize ] = Params.sanitizers(ctx.query, {
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
  })
  const { _id, type, origin, create_user, content, members } = ctx.query

  let match = {}
  const [, token] = verifyTokenToData(ctx)
  if(ObjectId.isValid(_id)) match._id = ObjectId(_id)
  if(!token) {
    match.type = ROOM_TYPE.SYSTEM
    match.origin = true
  }else {
    if(ROOM_TYPE[type]) match.type = type 
    if(origin !== undefined) match.origin = !!origin 
    if(ObjectId.isValid(create_user)) match.create_user = ObjectId(create_user)
    if(typeof content === 'string' && !!content) {
      const contentReg = {
        $regex: content,
        $options: 'ig'
      }
      match.$or = [
        {
          "info.name": contentReg
        },
        {
          "info.description": contentReg
        }
      ]
    }
    if(typeof members === 'string') {
      const list = members.split(',')
      if(!!list.length && list.every(item => ObjectId.isValid(item))) {
        match["members.user"] = {
          $in: list.map(item => ObjectId(item))
        }
      }
    }
  }

  const data = await RoomModel.aggregate([
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
        let: { customFields: "$user" },
        pipeline: [  
          {
            $lookup: {
              from: 'images',
              as: 'avatar',
              foreignField: "_id",
              localField: "avatar"
            }
          },
          {
            $unwind: {
              path: "$poster",
              preserveNullAndEmptyArrays: true 
            }
          }
        ],
        as: 'create_user',
      }
    },
    {
      $unwind: {
        path: "$create_user",
        preserveNullAndEmptyArrays: true 
      }
    },
    {
      from: 'images', 
      localField: 'info.avatar', 
      foreignField: '_id', 
      as: 'info.avatar'
    },
    {
      $unwind: {
        path: "$info.avatar",
        preserveNullAndEmptyArrays: true 
      }
    },
    {
      $project: {
        create_user: {
          username: "$create_user.username",
          avatar: "$create_user.avatar.src",
          _id: "$create_user._id"
        },
        info: {
          name: "$info.name",
          description: "$info.description",
          avatar: "$info.avatar.src"
        },
        members: {
          $size: {
            $ifNull: [
              "$members", []
            ]
          }
        },
        is_delete: {
          $size: {
            $ifNull: [
              "$delete_users", []
            ]
          }
        }
      }
    }
  ])
  .then(data => {
    return {
      data
    }
  })

  responseDataDeal({
    data,
    ctx,
    needCache: false 
  })

})
.post('/', joinRoom)
.put('/', async (ctx) => {
  const [, token] = verifyTokenToData(ctx)
  const check = Params.body(ctx, {
    name: '_id',
    validator: [
			data => ObjectId.isValid(data)
		]
  })
  if(check) return 

  const [ _id ] = Params.sanitizers(ctx.request.body, {
    name: '_id',
    sanitizers: [
      data => ObjectId(data)
    ]
  })

  const data = await new Promise((resolve) => {
    if(token) {
      const { id } = token
      const userId = ObjectId(id)
      resolve(MemberModel.updateOne({
        status: ROOM_USER_NET_STATUS.ONLINE,
        user: userId
      }, {
        $set: { status: ROOM_USER_NET_STATUS.OFFLINE }
      })
      .then(data => {
        if(data && data.nModified == 0) return Promise.reject({ errMsg: '权限不足' })
        return _id
      }))
    }else {
      resolve(_id)
    }
  })
  .then(data => ({ data }))
  .catch(dealErr(ctx))

  responseDataDeal({
    data,
    needCache: false,
    ctx
  })
  
})
.use(async(ctx, next) => {
  const [, token] = verifyTokenToData(ctx)
  if(!token) {
    const data = dealErr(ctx)({
      errMsg: 'not authorization',
      status: 401
    })
    responseDataDeal({
      data,
      ctx,
      needCache: false 
    })
    return 
  }
  return await next()
})
.delete('/', async (ctx) => {
  const [, token] = verifyTokenToData(ctx)
  const check = Params.query(ctx, {
    name: '_id',
    validator: [
			data => ObjectId.isValid(data)
		]
  })
  if(check) return 

  const { id } = token
  const userId = ObjectId(id)
  const [ _id ] = Params.sanitizers(data, {
    name: '_id',
    sanitizers: [
      data => ObjectId(data)
    ]
  })

  const data = await RoomModel.findOne({
    _id,
  })
  .select({
    type: 1,
    create_user: 1,
    members: 1,
    delete_users: 1
  })
  .exec()
  .then(parseData)
  .then(data => {
    const { members, create_user, type, delete_users } = data 
    if(type === ROOM_TYPE.SYSTEM || create_user !== id ||!members.some(item => item.user === id)) return Promise.reject({
      errMsg: 'forbidden',
      status: 403
    })
    if(type === ROOM_TYPE.CHAT && delete_users.length != 2) {
      return RoomModel.updateOne({
        _id,
        origin: false,
        type: ROOM_TYPE.CHAT,
      }, {
        $addToSet: {
          delete_users: userId
        }
      })
    }else {
      return RoomModel.remove({
        _id,
        origin: false,
        ...(type === ROOM_TYPE.CHAT ? {} : { create_user: data }),
      }, {
        single: true
      })
    }
  })
  .then(_ => {
    return MemberModel.updateOne({
      user: userId,
    }, {
      $pull: {
        room: _id
      }
    })
  })
  .then(_ => {
    return {
      data: _id
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