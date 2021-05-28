const Router = require('@koa/router')
const { 
  verifyTokenToData, 
  MemberModel, 
  MessageModel, 
  RoomModel, 
  dealErr, 
  Params, 
  responseDataDeal, 
  ROOM_TYPE, 
  authorizationMiddleware, 
  MESSAGE_MEDIA_TYPE,
  notFound
} = require('@src/utils')

const router = new Router()

router
.get('/', async(ctx) => {

  const [, token] = verifyTokenToData(ctx)
  const [ currPage, pageSize ] = Param.sanitizers(ctx.request.body, {
    name: '_id',
    sanitizers: [
      data => data.split(',').every(item => ObjectId(item))
    ]
  }, {
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

  let match = {}
  const { type } = ctx.query
  if(!token) {
    match.type = ROOM_TYPE.SYSTEM 
    match.origin = true 
  }else {
    if(!!type && !!ROOM_TYPE[type]) match.type = ROOM_TYPE[type]
  }

  const data = await (
    token ? 
      MemberModel.findOne({
      user: ObjectId(token.id)
      })
      .select({ _id: 1 })
      .exec()
      .then(notFound) 
    : 
      Promise.resolve())
  .then(data => {
    return   RoomModel.aggregate([
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
          from: 'user',
          let: { customFields: "$create_user" },
          pipeline: [
            {
              $lookup: {
                from: 'image',
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
            }
          ],
          as: 'create_user',
        },
      },
      {
        $unwind: {
          path: "$create_user",
          preserveNullAndEmptyArrays: true 
        }
      },
      {
        $lookup: {
          from: 'image',
          as: 'info.avatar',
          foreignField: "_id",
          localField: "info.avatar"
        }
      },
      {
        $unwind: {
          path: "$info.avatar",
          preserveNullAndEmptyArrays: true 
        }
      },
      {
        $lookup: {
          from: 'message',
          let: { customFields: "$message" },
          pipeline: [
            ...(data ? [{
              $match: {
                deleted: {
                  $nin: [ObjectId(data.id)]
                }
              }
            }] : [{}]),
            {
              $sort: {
                createdAt: -1
              }
            },
            {
              $limit: 99
            },
            {
              $project: {
                _id: 1,
                content: 1,
                readed: 1
              }
            }
          ],
          as: 'message',
        }
      },
      {
        $porject: {
          create_user: {
            username: "$create_user.uesrname",
            avatar: "$create_user.avatar.src",
            _id: "$create_user._id"
          },
          info: {
            name: "$info.name",
            avatar: "$info.avatar.src",
            description: "$info.description"
          },
          message: {
            $map: {
              input: "$message",
              as: 'value',
              in: {
                media_type: "$$value.media_type",
                content: {
                  text: "$$value.content.text",
                  image: "$$value.content.image",
                  video: "$$value.content.video",
                }
              }
            }
          }
        }
      }
    ])
  })
  .then(data => ({ data }))
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
			data => data.split(',').every(item => ObjectId.isValid(item))
		]
  })
  if(check) return 

  const [, token] = verifyTokenToData(ctx)
  const [ _id ] = Param.sanitizers(ctx.request.body, {
    name: '_id',
    sanitizers: [
      data => data.split(',').every(item => ObjectId(item))
    ]
  })
  const { request: { body: { type } } } = ctx 
  let match = {}
  if(type == '1') {
    match.room = _id[0]
  }else {
    match._id = {
      $in: _id
    }
  }

  const data = await new Promise((resolve, reject) => {
    if(token) {
      resolve()
    }else {
      reject({
        errMsg: 'not authorization',
        status: 401
      })
    }
  })
  .then(_ => {
    const { id } = token
    return MessageModel.updateMany(match, {
      $addToSet: {
        readed: ObjectId(id)
      }
    })
  })
  .then(_ => ({ data: _id }))
  // await RoomModel.updateOne({
  //   _id
  // }, {
  //   $set: { "members.$[message].message.$[user].readed": true }
  // }, {
  //   arrayFilters: [
  //     {
  //       message: {
  //         $type: 3
  //       },
  //       "message.user": ObjectId(id)
  //     },
  //     {
  //       user: {
  //         $type: 3
  //       },
  //       "user.readed": false
  //     }
  //   ]
  // })
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data,
    needCache: false 
  })

})
.delete('/', async (ctx) => {
  const [, token] = verifyTokenToData(ctx)
  const check = Params.body(ctx, {
    name: '_id',
    validator: [
			data => data.split(',').every(item => ObjectId.isValid(item))
		]
  })
  if(check) return 

  const { id } = token
  const [ _id ] = Params.sanitizers(ctx.query, {
    name: '_id',
    sanitizers: [
      data => data.split(',').every(item => ObjectId(item))
    ]
  })
  let match = {}
  const { query: { type } } = ctx
  if(type == '1') {
    match.room = _id[0]
  }else {
    match._id = {
      $in: _id
    }
  }

  const data = await new Promise((resolve, reject) => {
    if(token) {
      resolve(MemberModel.findOne({
        user: ObjectId(id)
      })
      .select({
        _id: 1
      })
      .exec()
      .then(notFound))
    }else {
      reject({
        errMsg: 'not authorization',
        status: 401
      })
    }
  })
  .then(data => {
    return MessageModel.updateMany(match, {
      $addToSet: { deleted: ObjectId(data._id) }
    })
  })
  .then(_ => ({ data: _id }))
  .catch(dealErr(ctx))

  responseDataDeal({
    data,
    needCache: false,
    ctx
  })
  
})
.get('/detail', async(ctx) => {

  const check = Params.query(ctx, {
    name: '_id',
    validator: [
			data => ObjectId.isValid(data)
		]
  })
  if(check) return 

  const [, token] = verifyTokenToData(ctx)
  const [ _id, currPage, pageSize ] = Param.sanitizers(ctx.request.body, {
    name: '_id',
    sanitizers: [
      data => data.split(',').every(item => ObjectId(item))
    ]
  }, {
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
  let match = {
    _id
  }
  if(!token) {
    match.type = ROOM_TYPE.SYSTEM
    match.origin = true 
  }

  const data = await RoomModel.aggregate([
    {
      $match: match
    },
    {
      $lookup: {
        from: 'message', 
        let: { customFields: "$message" }, 
        pipeline: [ 
          {
            $sort: {
              createdAt: -1
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
              from: 'user',
              let: { customFields: "$user_info" },
              pipeline: [
                {
                  $lookup: {
                    from: 'image',
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
                }
              ],
              as: 'user_info',
            },
          },
          {
            $unwind: {
              path: "$user_info",
              preserveNullAndEmptyArrays: true 
            }
          },
          {
            $lookup: {
              from: 'images',
              as: 'content.image',
              foreignField: "_id",
              localField: "content.image"
            }
          },
          {
            $unwind: {
              path: "$content.image",
              preserveNullAndEmptyArrays: true 
            }
          },
          {
            $lookup: {
              from: 'videos',
              as: 'content.video',
              foreignField: "_id",
              localField: "content.video"
            }
          },
          {
            $unwind: {
              path: "$content.video",
              preserveNullAndEmptyArrays: true 
            }
          }
        ],
        as: 'message',
      }
    },
    {
      $project: {
        message: {
          $map: {
            input: "$message",
            as: 'value',
            in: {
              media_type: "$$value.media_type",
              user_info: {
                username: "$$value.user_info.username",
                avatar: "$$value.user_info.avatar.src",
                _id: "$$value.user_info._id",
              },
              point_to: "$$value.point_to",
              content: {
                text: "$$value.content.text",
                image: "$$value.content.image.src",
                video: {
                  src: "$$value.content.video.src",
                  poster: "$$value.content.video.poster",
                }
              }
            }
          }
        }
      }
    }
  ])
  .then(data => ({ data }))
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data,
    needCache: false 
  })

})
.use(authorizationMiddleware())
.post('/', async(ctx) => {
  let templateMessage = {}
  const check = Params.body(ctx, {
    name: 'content',
    validator: [
      data => typeof data === 'string'
    ]
  }, {
    name: 'type',
    validator: [
      data => !!data && !!Object.keys(MESSAGE_MEDIA_TYPE).includes(data)
    ]
  }, {
    name: '_id',
    validator: [
			data => ObjectId.isValid(data)
		]
  })

  if(check) return 

  const [, token] = verifyTokenToData(ctx)

  const { id } = token
  let userId = ObjectId(id)
  const [ roomId, type, content, point_to ] = Params.sanitizers(ctx.request.body, {
    name: '_id',
    sanitizers: [
      data => ObjectId(data)
    ]
  }, {
    name: 'type',
    sanitizers: [
      data => data.toUpperCase()
    ]
  }, {
    name: 'content',
    sanitizers: [
      data => ObjectId.isValid(data) ? ObjectId(data) : data
    ]
  }, {
    name: 'point_to',
    sanitizers: [
      data => ObjectId.isValid(data) ? ObjectId(data) : data
    ]
  })

  if(point_to) templateMessage.point_to = point_to
  templateMessage = {
    media_type: type,
    room: roomId,
    content: {
      [type.toLowerCase()]: content
    }
  }

  const data = await MemberModel.findOne({
    user: userId,
    room: {
      $in: [roomId]
    }
  })
  .select({
    room: 1
  })
  .exec()
  .then(notFound)
  .then(data => {
    const { _id } = data 
    userId = _id
    templateMessage.user_info = userId
    templateMessage.readed = [userId]
    const message = new MessageModel(templateMessage)
    return message.save()
  })
  .then(data => {
    return RoomModel.updateOne({
      _id: roomId,
      members: {
        $in: [userId]
      }
    }, {
      $addToSet: {
        message: data._id
      }
    })
  })
  .then(data => {
    if(data && data.nModified == 0) return Promise.reject({ errMsg: 'forbidden', status: 403 })
  })
  .catch(dealErr(ctx))
  
  responseDataDeal({
    ctx,
    data,
    needCache: false 
  })
  
})

module.exports = router