const Router = require('@koa/router')
const { verifyTokenToData, UserModel, FriendsModel, MemberModel, FRIEND_STATUS, dealErr, notFound, Params, responseDataDeal, avatarGet, parseData } = require("@src/utils")
const { Types: { ObjectId } } = require('mongoose')
const AgreeFriends = require('./agree-friends')

const router = new Router()

router
.use(async(ctx, next) => {
  const { method } = ctx
  if(method.toLowerCase() === 'get') return await next()
  let _method 
  if(method.toLowerCase() === 'post') {
    _method = 'body'
  }else if(method.toLowerCase() === 'delete') {
    _method = 'query'
  }

  const check = Params[_method](ctx, {
    name: '_id',
    validator: [
			data => ObjectId.isValid(data)
		]
  })
  if(check) return

  return await next()
})
.get('/', async (ctx) => {
  
  const [ currPage, pageSize ] = Params.sanitizers(ctx.query, {
    name: 'currPage',
    _default: 0,
    type: ['toInt'],
    sanitizers: [
      data => data >= 0 ? data : 0
    ]
  }, {
    name: 'pageSize',
    _default: 30,
    type: ['toInt'],
    sanitizers: [
      data => data >= 0 ? data : 30
    ]
  })

  const [, token] = verifyTokenToData(ctx)
  const { id } = token

  const data = await FriendsModel.aggregate([
    {
      $match: {
        user: ObjectId(id),
      }
    },
    {
      $unwind: "$friends"
    },
    {
      $match: {
        "friends.status": {
          $in: [
            FRIEND_STATUS.NORMAL,
            FRIEND_STATUS.AGREE
          ]
        }
      }
    },
    {
      $skip: pageSize * currPage
    },
    {
      $limit: pageSize
    },
    {
      $lookup: {
        from: 'users', 
        let: {
          friend_id: "$friends._id"
        },
        pipeline: [  
          {
            $match: {
              $expr: {
                $eq: [
                  "$friend_id", "$$friend_id"
                ]
              }
            }
          },
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
              path: "$avatar",
              preserveNullAndEmptyArrays: true 
            }
          },
          {
            $project: {
              _id: 1,
              username: 1,
              description: 1,
              avatar: "$avatar.src",
              friend_id: 1,
            }
          },
        ],
        as: 'user_info',
      }
    },
    {
      $unwind: "$user_info"
    },
    {
      $lookup: {
        from: 'friends',
        as: 'member_info',
        foreignField: "_id",
        localField: "friends._id"
      }
    },
    {
      $unwind: "$member_info"
    },
    {
      $project: {
        member: "$member_info.member",
        _id: "$user_info._id",
        username: "$user_info.username",
        description: "$user_info.description",
        avatar: "$user_info.avatar",
        friend_id: "$user_info.friend_id",
        createdAt: 1,
      }
    }
  ])
  .then(data => {
    return {
      data: {
        friends: data
      }
    }
  })
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data
  })

})
.post('/', async (ctx) => {
  const [, token] = verifyTokenToData(ctx)
  const [ _id ] = Params.sanitizers(ctx.request.body, {
    name: '_id',
    sanitizers: [
      data => ObjectId(data)
    ]
  })

  let { id } = token
  id = ObjectId(id)

  const data = await FriendsModel.findOne({
    user: id,
    _id: {
      $nin: [_id]
    },
    "friends._id": {
      $nin: [_id]
    }
  })
  .select({
    _id: 1,
    friends: 1
  })
  .exec()
  .then(notFound)
  .then(data => {
    const selfFriendId = data._id 
    return FriendsModel.updateOne({
      _id,
      $where: "this.friends.length < 9999",
      "friends._id": {
        $nin: [
          selfFriendId
        ]
      }
    }, {
      $push: { friends: { _id: selfFriendId, timestamps: Date.now(), status: FRIEND_STATUS.TO_AGREE } },
    })
  })
  .then(data => {
    const isExists = !!data && data.nModified == 1
    return FriendsModel.updateOne({
      user: id,
      $where: "this.friends.length < 9999"
    }, {
      $push: { friends: { _id, timestamps: Date.now(), status: isExists ? FRIEND_STATUS.TO_AGREEING : FRIEND_STATUS.NORMAL } },
    })
  })
  .then(_ => ({ data: _id }))
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data,
    needCache: false
  })
})
.delete('/', async(ctx) => {
  
  const [ _id ] = Params.sanitizers(ctx.query, {
    name: '_id',
    sanitizers: [
      data => ObjectId(data)
    ]
  })

  const [, token] = verifyTokenToData(ctx)
  const { id } = token

  const data = await FriendsModel.findOne({
    user: ObjectId(id),
    friends: { 
      $elemMatch: { 
        _id: _id,
        status: {
          $nin: [
            FRIEND_STATUS.TO_AGREE,
            FRIEND_STATUS.DIS_AGREE,
            FRIEND_STATUS.TO_AGREEING,
            FRIEND_STATUS.DIS_AGREEED,
          ] 
        }
      } 
    }
  })
  .select({
    _id: 1
  })
  .exec()
  .then(notFound)
  .then(() => {
    return Promise.all([
      UserModel.updateOne({
        _id: ObjectId(id)
      }, {
        $inc: { friends: -1 }
      }),
      FriendsModel.updateOne({
        user: ObjectId(id)
      }, {
        $pull: { friends: { _id } }
      })
    ])
  })
  .then(_ => ({ data: _id }))
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data,
    needCache: false
  })

})
.use('/agree', AgreeFriends.routes(), AgreeFriends.allowedMethods())

module.exports = router