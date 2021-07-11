const Router = require('@koa/router')
const { Types: { ObjectId } } = require('mongoose')
const Day = require('dayjs')
const { 
  verifyTokenToData, 
  MemberModel, 
  MessageModel, 
  RoomModel, 
  dealErr, 
  Params, 
  responseDataDeal, 
  ROOM_TYPE, 
  Authorization, 
  MESSAGE_MEDIA_TYPE,
  notFound
} = require('@src/utils')

const router = new Router()

router
.get('/', async(ctx) => {

  const [, token] = verifyTokenToData(ctx)
  const [ _id, currPage, pageSize ] = Params.sanitizers(ctx.request.body, {
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
    let messageMatch = []
    if(data) {
      messageMatch = [
        {
          $match: {
            deleted: {
              $nin: [ObjectId(data._id)]
            },
            $expr: {
              "$eq": [ "$room", "$$room_id" ],
            },
          }
        }
      ]
    }

    return RoomModel.aggregate([
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
          from: 'members',
          as: 'create_user',
          foreignField: "_id",
          localField: "create_user"
        }
      },
      {
        $unwind: {
          path: "$create_user",
          preserveNullAndEmptyArrays: true 
        }
      },
      {
        $lookup: {
          from: 'users',
          let: { 
            create_user_id: "$create_user.user"
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  "$eq": [ "$_id", "$$create_user_id" ]
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
          ],
          as: 'create_user_info'
        }
      },
      {
        $unwind: {
          path: "$create_user_info",
          preserveNullAndEmptyArrays: true 
        }
      },
      {
        $lookup: {
          from: 'images',
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
          from: 'messages',
          let: { 
            room_id: "$_id",
          },
          pipeline: [
            ...messageMatch,
            {
              $sort: {
                createdAt: -1
              }
            },
            {
              $limit: 1
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
              $lookup: {
                from: 'videos',
                as: 'content.video',
                let: {
                  content_video: "$content.video"
                },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $eq: [
                          "$_id", "$$content_video"
                        ]
                      }
                    }
                  },
                  {
                    $lookup: {
                      from: 'images',
                      as: 'poster',
                      foreignField: "_id",
                      localField: "poster" 
                    }
                  },
                  {
                    $unwind: {
                      path: "$poster",
                      preserveNullAndEmptyArrays: true 
                    }
                  }
                ]
              }
            },
            {
              $unwind: {
                path: "$content.video",
                preserveNullAndEmptyArrays: true 
              }
            },
            {
              $unwind: {
                path: "$content.image",
                preserveNullAndEmptyArrays: true 
              }
            },
            {
              $project: {
                _id: 1,
                text: "$content.text",
                image: "$content.image.src",
                video: "$content.video.src",
                poster: "$content.video.poster",
                media_type: 1
              }
            }
          ],
          as: 'message_info',
        }
      },
      {
        $unwind: "$message_info"
      },
      {
        $lookup: {
          from: 'messages',
          let: { 
            room_id: "$_id",
          },
          pipeline: [
            ...(data ? [{
              $match: {
                deleted: {
                  $nin: [ObjectId(data._id)]
                },
                readed: {
                  $nin: [ObjectId(data._id)]
                },
                $expr: {
                  "$eq": [ "$room", "$$room_id" ]
                }
              }
            }] : []),
            {
              $project: {
                _id: 1
              }
            }
          ],
          as: 'un_read_message',
        }
      },
      {
        $project: {
          _id: 1,
          type: 1,
          create_user: {
            username: "$create_user_info.username",
            avatar: "$create_user_info.avatar.src",
            _id: "$create_user_info._id",
            member: "$create_user._id",
            description: "$create_user_info.description",
          },
          info: {
            name: "$info.name",
            avatar: "$info.avatar.src",
            description: "$info.description"
          },
          message_info: "$message_info",
          un_read_message_count: {
            $size: {
              $ifNull: [
                "$un_read_message", []
              ]
            }
          },
          createdAt: 1,
          updatedAt: 1
        },
      },
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
.get('/detail', async(ctx) => {

  const check = Params.query(ctx, {
    name: '_id',
    validator: [
			data => ObjectId.isValid(data)
		]
  })
  if(check) return 

  const [, token] = verifyTokenToData(ctx)
  const [ _id, currPage, pageSize, start, messageId ] = Params.sanitizers(ctx.query, {
    name: '_id',
    sanitizers: [
      data => ObjectId(data)
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
  }, {
    name: 'start',
    sanitizers: [
      data => {
        return Day(data).isValid() && !!data ? Day(data).toDate() : false
      }
    ]
  }, {
    name: 'messageId',
    sanitizers: [
      data => {
        return ObjectId.isValid(data) ? ObjectId(data) : false 
      }
    ]
  })
  let match = {
    _id
  }
  let messageMatch = {
    room: _id 
  }
  let skipLimitPipe = [
    {
      $limit: pageSize
    }
  ]
  if(start) {
    messageMatch.createdAt = {
      $lte: start
    }
  }else {
    skipLimitPipe.unshift({
      $skip: currPage * pageSize
    })
  }
  if(messageId) {
    messageMatch.$expr = {
      $eq: [ "$_id", messageId ]
    }
  }

  const data = await new Promise((resolve) => {
    if(token) {
      const { id } = token
      resolve(MemberModel.findOne({
        user: ObjectId(id),
        room: {
          $in: [_id]
        }
      })
      .select({
        _id: 1
      })
      .exec()
      .then(notFound))
    }else {
      match.type = ROOM_TYPE.SYSTEM
      match.origin = true 
      resolve()
    }
  })
  .then(_ => {
    return RoomModel.aggregate([
      {
        $match: match
      },
      {
        $lookup: {
          from: 'images',
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
          from: 'messages', 
          as: 'message',
          pipeline: [
            {
              $match: messageMatch
            },
            {
              $sort: {
                createdAt: 1
              }
            },
            ...skipLimitPipe,
            {
              $lookup: {
                from: 'members',
                let: { member: "$user_info" }, 
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $eq: [ "$_id", "$$member" ]
                      }
                    }
                  },
                  {
                    $lookup: {
                      from: 'users',
                      let: { 
                        member_user_id: "$user" 
                      }, 
                      pipeline: [
                        {
                          $match: {
                            $expr: {
                              $eq: [
                                "$_id",
                                "$$member_user_id"
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
                            avatar: "$avatar.src",
                            username: 1,
                            description: 1,
                            friend_id: 1
                          }
                        }
                      ],
                      as: "user_info"
                    }
                  },
                  {
                    $unwind: {
                      path: "$user_info",
                      preserveNullAndEmptyArrays: true 
                    }
                  },
                  {
                    $project: {
                      _id: "$user_info._id",
                      avatar: "$user_info.avatar",
                      username: "$user_info.username",
                      description: "$user_info.description",
                      member: "$_id",
                      friend_id: "$user_info.friend_id"
                    }
                  }
                ],
                as: 'user_info'
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
              $lookup: {
                from: 'videos',
                as: 'content.video',
                let: {
                  content_video: "$content.video"
                },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $eq: [
                          "$_id", "$$content_video"
                        ]
                      }
                    }
                  },
                  {
                    $lookup: {
                      from: 'images',
                      as: 'poster',
                      foreignField: "_id",
                      localField: "poster" 
                    }
                  },
                  {
                    $unwind: {
                      path: "$poster",
                      preserveNullAndEmptyArrays: true 
                    }
                  }
                ]
              }
            },
            {
              $unwind: {
                path: "$content.video",
                preserveNullAndEmptyArrays: true 
              }
            },
            {
              $unwind: {
                path: "$content.image",
                preserveNullAndEmptyArrays: true 
              }
            },
            {
              $project: {
                _id: 1,
                user_info: "$user_info",
                point_to: 1,
                content: {
                  text: "$content.text",
                  image: "$content.image.src",
                  video: "$content.video.src",
                  poster: "$content.video.poster.src",
                },
                createdAt: 1,
                updatedAt: 1,
                media_type: 1
              }
            }
          ],
        }
      },
      {
        $project: {
          message: "$message",
          room: {
            _id: "$_id",
            info: {
              name: "$info.name",
              description: "$info.description",
              avatar: "$info.avatar.src"
            }
          },
          _id: 0
        }
      }
    ])
  })
  .then(data => {
    if(!data.length) return Promise.reject({ status: 404, errMsg: 'not found' })
    return data[0]
  })
  .then(data => ({ data }))
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data,
    needCache: false 
  })

})
.use(Authorization())
.delete('/', async (ctx) => {
  const [, token] = verifyTokenToData(ctx)
  const check = Params.query(ctx, {
    name: '_id',
    validator: [
			data => data.split(',').every(item => ObjectId.isValid(item.trim()))
		]
  })
  if(check) return 

  const { id } = token
  const [ _id ] = Params.sanitizers(ctx.query, {
    name: '_id',
    sanitizers: [
      data => data.split(',').map(item => ObjectId(item.trim()))
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

  const data = await MemberModel.findOne({
    user: ObjectId(id)
  })
  .select({
    _id: 1
  })
  .exec()
  .then(notFound)
  .then(data => {
    return MessageModel.updateMany(match, {
      $addToSet: { deleted: data._id }
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
.put('/', async (ctx) => {
  const check = Params.body(ctx, {
    name: '_id',
    validator: [
			data => {
        return data.split(',').every(item => ObjectId.isValid(item.trim()))
      }
		]
  })
  if(check) return 

  const [, token] = verifyTokenToData(ctx)
  const [ _id ] = Params.sanitizers(ctx.request.body, {
    name: '_id',
    sanitizers: [
      data => data.split(',').map(item => ObjectId(item.trim()))
    ]
  })
  const { request: { body: { type } } } = ctx 
  let match = {}
  if(type == '1') {
    match.room = {
      $in: _id
    }
  }else {
    match._id = {
      $in: _id
    }
  }
  const { id } = token

  const data = await MemberModel.findOne({
    user: ObjectId(id)
  })
  .select({
    _id: 1
  })
  .exec()
  .then(notFound)
  .then(data => {
    return MessageModel.updateMany(match, {
      $addToSet: {
        readed: ObjectId(data._id)
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
.post('/', async(ctx) => {
  let templateMessage = {}
  const check = Params.body(ctx, {
    name: 'content',
    validator: [
      (data, origin) => {
        const { type } = origin
        return typeof data === 'string' && (type !== MESSAGE_MEDIA_TYPE.TEXT ? ObjectId.isValid(data) : !!data.length)
      }
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
    return Promise.all([
      RoomModel.updateOne({
        _id: roomId,
        members: {
          $in: [userId]
        },
        deleted: false 
      }, {
        $addToSet: {
          message: data._id
        }
      }),
      data
    ])
  })
  .then(([data, message]) => {
    if(data && data.nModified == 0) return Promise.reject({ errMsg: 'forbidden', status: 403 })
    return {
      data: message._id
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