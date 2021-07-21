const Router = require('@koa/router')
const { Types: { ObjectId } } = require('mongoose')
const { verifyTokenToData, UserModel, FriendsModel, FRIEND_STATUS, dealErr, notFound, Params, responseDataDeal } = require("@src/utils")

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
            FRIEND_STATUS.TO_AGREE,
            FRIEND_STATUS.AGREE,
            FRIEND_STATUS.DIS_AGREE,
            FRIEND_STATUS.DIS_AGREEED,
            FRIEND_STATUS.NORMAL,
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
        from: 'friends', 
        localField: 'friends._id', 
        foreignField: '_id', 
        as: 'friend_origin_data'
      }
    },
    {
      $unwind: "$friend_origin_data"
    },
    {
      $lookup: {
        from: 'users', 
        let: { user_id: "$friend_origin_data.user" },
        pipeline: [  
          {
            $match: {
              $expr: {
                "$eq": [ "$_id", "$$user_id" ]
              },
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
              avatar: "$avatar.src",
              description: 1,
              username: 1,
            }
          }
        ],
        as: 'friends_info',
      }
    },
    {
      $unwind: "$friends_info"
    },
    {
      $project: {
        friend_id: "$friends._id",
        avatar: "$friends_info.avatar",
        username: "$friends_info.username",
        _id: "$friends_info._id",
        description: "$friends_info.description",
        createdAt: "$friends.timestamps",
        status: "$friends.status"
      }
    }
  ])
  .then(data => ({ data: { friends: data } }))
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data,
    needCache: false 
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

  let { id, friend_id } = token
  friend_id = ObjectId(friend_id)
  id = ObjectId(id)

  const data = await FriendsModel.findOne({
    _id,
    friends: { 
      $elemMatch: { 
        $and: [
          {
            _id: friend_id
          },
          {
            status: FRIEND_STATUS.TO_AGREEING
          }
        ]
      } 
    },
  })
  .select({
    _id: 1,
    friends: 1
  })
  .exec()
  .then(notFound)
  .then(_ => {
    return Promise.all([
      UserModel.updateMany({
        $or: [
          {
            _id: id 
          },
          {
            friend_id: _id
          }
        ]
      }, {
        $inc: { friends: 1 }
      }),
      FriendsModel.updateOne({
        _id,
        friends: { 
          $elemMatch: { 
            _id: friend_id
          } 
        }
      }, {
        $set: { 
          "friends.$.status": FRIEND_STATUS.AGREE,
          "friends.$.timestamps": Date.now()
        }
      }),
      FriendsModel.updateOne({
        user: id,
        friends: { 
          $elemMatch: { 
            _id
          } 
        }
      }, {
        $set: { 
          "friends.$.status": FRIEND_STATUS.NORMAL,
          "friends.$.timestamps": Date.now()
        }
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
.delete('/', async(ctx) => {
  
  const [ _id ] = Params.sanitizers(ctx.query, {
    name: '_id',
    sanitizers: [
      data => ObjectId(data)
    ]
  })

  const [, token] = verifyTokenToData(ctx)
  const { friend_id } = token

  const data = await FriendsModel.updateOne({
    _id: ObjectId(friend_id),
    friends: { 
      $elemMatch: { 
        $and: [
          {
            _id,
          },
          {
            status: FRIEND_STATUS.TO_AGREEING
          }
        ]
      } 
    }
  }, {
    $set: { 
      "friends.$.status": FRIEND_STATUS.DIS_AGREE
    }
  })
  .then(data => {
    if(!data || data.nModified === 0) return Promise.reject({ errMsg: 'not found', status: 404 })
    return FriendsModel.findOneAndUpdate({
      _id,
      friends: { 
        $elemMatch: { 
          $and: [
            {
              _id: ObjectId(friend_id),
            },
            {
              status: FRIEND_STATUS.TO_AGREE
            }
          ]
        } 
      }
    }, {
      $set: { 
        "friends.$.status": FRIEND_STATUS.DIS_AGREEED
      }
    })
    .select({
      _id: 1
    })
    .exec()
  })
  .then(notFound)
  .then(_ => ({ data: _id }))
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data,
    needCache: false
  })

})

module.exports = router