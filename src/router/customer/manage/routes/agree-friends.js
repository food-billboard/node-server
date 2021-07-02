const Router = require('@koa/router')
const { verifyTokenToData, UserModel, FriendsModel, MemberModel, FRIEND_STATUS, dealErr, notFound, Params, responseDataDeal, avatarGet, parseData } = require("@src/utils")
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

async function checkMember(user) {
  return MemberModel.findOne({
    user,
  })
  .select({
    _id: 1
  })
  .exec()
  .then(data => {
    if(data) return data 
    const model = new MemberModel({
      user
    })
    return model.save()
  })
}

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

  const data = FriendsModel.aggregate([
    {
      $match: {
        $and: [
          {
            "friends._id": id
          },
          {
            "friends.status": FRIEND_STATUS.TO_AGREE
          }
        ]
      }
    },
    {
      $unwind: "$friends"
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
        let: { customFields: "$friends._id" },
        pipeline: [  
          {
            $match: {
              $expr: {
                "$eq": [ "$_id", "$$customFields" ]
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
              username: 1
            }
          }
        ],
        as: 'friends',
      }
    },
    {
      $unwind: "$friends"
    },
    {
      $project: {
        avatar: "$friends.avatar",
        username: "$friends.username",
        _id: "$friends._id",
        description: "$friends.description"
      }
    }
  ])
  .then(data => ({ friends: data }))
  .then(data => {
    console.log(data)
    return data 
  })

  // const data = await FriendsModel.findOne({
  //   user: ObjectId(id),
  //   "friends.status": FRIEND_STATUS.TO_AGREE
  // })
  // .select({
  //   friends: 1,
  //   member: 1
  // })
  // .populate({
  //   path: 'friends._id',
  //   select: {
  //     username: 1,
  //     avatar: 1,
  //     description: 1
  //   },
  //   options: {
  //     limit: pageSize,
  //     skip: pageSize * currPage
  //   }
  // })
  // .exec()
  // .then(parseData)
  // .then(data => {
  //   const { friends=[] } = data || {}
  //   return {
  //     data: {
  //       ...data,
  //       friends: friends.filter(item => !!item._id).map(a => {
  //         const { _id: { avatar, ...nextData } } = a
  //         return {
  //           ...nextData,
  //           avatar: avatarGet(avatar),
  //         }
  //       })
  //     }
  //   }
  // })
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
    user: _id,
    $and: [
      {
        "friends._id": id
      },
      {
        "friends.status": FRIEND_STATUS.TO_AGREE
      }
    ]
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
        _id: {
          $in: [id, _id]
        },
      }, {
        $inc: { friends: 1 }
      }),
      FriendsModel.updateOne({
        user: _id,
        friends: { 
          $elemMatch: { 
            id
          } 
        }
      }, {
        $set: { 
          "friends.$.status": FRIEND_STATUS.NORMAL
        }
      }),
      FriendsModel.updateOne({
        user: id,
        $where: "this.friends.length < 9999"
      }, {
        $addToSet: {
          friends: {
            _id,
            timestamps: Date.now(),
            status: FRIEND_STATUS.NORMAL
          }
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
  const { id } = token

  const data = await FriendsModel.findOne({
    user: _id,
    friends: { 
      $elemMatch: { 
        _id: ObjectId(id)
      } 
    }
  })
  .select({
    _id: 1
  })
  .exec()
  .then(notFound)
  .then(() => {
    return FriendsModel.updateOne({
      user: _id
    }, {
      $pull: { friends: { _id } }
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

module.exports = router