const Router = require('@koa/router')
const { Types: { ObjectId } } = require('mongoose')
const { verifyTokenToData, RoomModel, dealErr, Params, responseDataDeal, notFound, MemberModel, ROOM_TYPE } = require('@src/utils')

const router = new Router()

router 
.get('/', async(ctx) => {
  const { currPage, pageSize, _id, content } = Params.sanitizers(ctx.query, {
    name: 'currPage',
    _default: 0,
    sanitizers: [
      data => {
        return {
          done: true,
          data: data >= 0 ? +data : 0
        }
      }
    ]
  }, {
    name: 'pageSize',
    _default: 30,
    sanitizers: [
      data => {
        return {
          done: true,
          data: data >= 0 ? +data : 30
        }
      }
    ]
  }, {
    name: '_id',
    sanitizers: [
      data => {
        if(ObjectId.isValid(data)) return {
          done: true,
          data: {
            room: {
              $in: [ObjectId(data)]
            }
          }
        }
        return {
          done: false 
        }
      }
    ]
  }, {
    name: 'content',
    sanitizers: [
      data => {
        if(typeof data === 'string' && !!data.length) {

          function reg(content) {
            return {
              $regex: content,
              $options: 'gi'
            }
          }

          let filter = [
            {
              username: reg(data)
            },
            {
              description: reg(data)
            },
          ]

          return {
            done: true,
            data: {
              $or: filter
            }
          }
        }
        return {
          done: false 
        }
      }
    ]
  }, true)

  const userMatch = {
    ...content
  }

  let roomMatch = {
    ..._id
  }
  // const [, token] = verifyTokenToData(ctx)
  // if(!token) {
  //   match.type = ROOM_TYPE.SYSTEM
  //   match.origin = true
  // }

  const data = await Promise.all([
    MemberModel.aggregate([
      {
        $match: roomMatch
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
    MemberModel.aggregate([
      {
        $match: roomMatch
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
              $match: {
                $expr: {
                  "$eq": [ "$_id", "$$customFields" ]
                },
                ...userMatch,
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
                username: 1,
                avatar: "$avatar.src",
                _id: 1,
                friend_id: 1
              }
            }
          ],
          as: 'user',
        }
      },
      {
        $unwind: {
          path: "$user",
          preserveNullAndEmptyArrays: true 
        }
      },
      {
        $project: {
          user: "$user",  
          status: 1,
          sid: 1,
          createdAt:1,
          updatedAt: 1,
          _id: 1,
          room: "$room_list"
        }
      }
    ])
  ])
  .then(([total_count, data]) => {
    if(!Array.isArray(total_count) || !Array.isArray(data)) return Promise.reject({ errMsg: 'data error', status: 404 })
    return {
      total: total_count.length ? total_count[0].total || 0 : 0,
      list: data,
    }
  })
  .then(data => ({ data }))
  .catch(dealErr(ctx))

  responseDataDeal({
    data,
    ctx,
    needCache: false 
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
.use(async(ctx, next) => {
  const [, token] = verifyTokenToData(ctx)
  const [ id ] = token
  let method = ctx.request.method.toLowerCase()
  let filterPos 
  let body 
  try {
    if(method === 'delete') {
      filterPos = 'query'
      body = ctx.query
    }else {
      filterPos = 'body'
      body = ctx.request.body
    }
  }catch(err) {}
  const check = Params[filterPos](ctx, {
    name: '_id',
    validator: [
      data => ObjectId.isValid(data)
    ]
  }, {
    name: 'members',
    validator: [
      data => data.split(',').every(item => ObjectId.isValid(item))
    ]
  })
  if(check) return 

  const [ _id ] = Params.sanitizers(body, {
    name: '_id',
    sanitizers: [
      data => ObjectId(data)
    ]
  })

  const data = await RoomModel.findOne({
    _id
  })
  .select({
    create_user: 1
  })
  .exec()
  .then(notFound)
  .then(data => {
    const { create_user } = data 
    if(create_user == id) return null 
    return Promise.reject({
      errMsg: 'forbidden',
      status: 403
    })
  })
  .catch(dealErr(ctx))

  if(!data) return await next() 
  responseDataDeal({
    ctx,
    data,
    needCache: false 
  })

})
.delete('/', async(ctx) => {
  const [ _id, members ] = Params.sanitizers(ctx.query, {
    name: '_id',
    sanitizers: [
      data => ObjectId(data)
    ]
  }, {
    name: 'members',
    sanitizers: [
      data => data.split(',').map(item => ObjectId(item))
    ]
  })

  const data = await Promise.all([
    MemberModel.updateMany({
      _id: {
        $in: members
      },
    }, {
      $pull: {
        room: _id
      }
    }),
    RoomModel.updateOne({
      _id
    }, {
      $pullAll: {
        members
      }
    })
  ])
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
.put('/', async(ctx) => {
  const [ _id, members ] = Params.sanitizers(ctx.query, {
    name: '_id',
    sanitizers: [
      data => ObjectId(data)
    ]
  }, {
    name: 'members',
    sanitizers: [
      data => data.split(',').map(item => ObjectId(item))
    ]
  })

  const data = await Promise.all([
    RoomModel.updateOne({
      _id,
    }, {
      $addToSet: {
        members: {
          $each: members
        }
      }
    }),
    MemberModel.updateMany({
      _id: {
        $in: members
      }
    }, {
      $addToSet: {
        room: _id
      }
    }, {
      upsert: true 
    })
  ])
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