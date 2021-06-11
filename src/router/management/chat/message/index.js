const Router = require('@koa/router')
const { merge } = require('lodash')
const { Types: { ObjectId } } = require('mongoose')
const { MessageModel, RoomModel, verifyTokenToData, Params, notFound, avatarGet, MESSAGE_TYPE, MESSAGE_MEDIA_TYPE, ROOM_TYPE, dealErr, responseDataDeal } = require('@src/utils')

const router = new Router()

router
.get('/', async (ctx) => {
  const check = Params.query(ctx, {
    name: '_id',
    validator: [
			data => ObjectId.isValid(data)
		]
  })
  if(check) return 

  const [ _id, currPage, pageSize ] = Params.sanitizers(ctx.query, {
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
  })

  const data = await Promise.all([
    MessageModel.aggregate([
      {
        $match: {
          room: _id 
        }
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
    MessageModel.aggregate([
      {
        $match: {
          room: _id 
        }
      },
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
                  },
                  {
                    $project: {
                      _id: 1,
                      avatar: "$avatar.src",
                      username: 1,
                      description: 1
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
                member: "$$member"
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
          message_type: 1,
          point_to: 1,
          readed_count: {
            $size: {
              $ifNull: [
                "$readed", []
              ]
            }
          },  
          deleted_count: {
            $size: {
              $ifNull: [
                "$deleted", []
              ]
            }
          }, 
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
    ]),
    RoomModel.findOne({
      _id
    })
    .select({
      _id: 1,
      info: 1,
      createdAt: 1,
      updatedAt: 1,
      type: 1
    })
    .populate({
      path: "info.avatar",
      select: {
        src: 1,
      }
    })
    .exec()
    .then(notFound)
    .then(data => {
      const { info, ...nextData } = data 
      return merge({}, ...nextData, {
        info: merge({}, info, {
          avatar: avatarGet(info.avatar)
        })
      })
    })
  ])
  .then(([total_count, data, roomData]) => {
    if(!Array.isArray(total_count) || !Array.isArray(data)) return Promise.reject({ errMsg: 'data error', status: 404 })
    return {
      data: {
        total: total_count.length ? total_count[0].total || 0 : 0,
        list: data,
        room: roomData
      }
    }
  })
  .then(data => ({ data }))
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data,
    needCache: false 
  })
})
.post('/', async (ctx) => {
  const MEDIA_MAP = {
    IMAGE: 'image',
    VIDEO: 'video',
    AUDIO: 'audio',
    TEXT: 'text' 
  }
  const check = Params.body(ctx, {
    name: 'content',
    validator: [
      (data, origin) => {
        return origin.media_type != MESSAGE_MEDIA_TYPE.TEXT ? ObjectId.isValid(data) : !!data
      }
    ]
  },
  {
    name: 'media_type',
    validator: [
      data => Object.keys(MESSAGE_MEDIA_TYPE).includes(data)
    ]
  }, {
    name: '_id',
    validator: [
      data => ObjectId.isValid(data)
    ]
  })

  if(check) return 

  const { _id, content, media_type, point_to } = Params.sanitizers(ctx.request.body, {
    name: '_id',
    sanitizers: [
      data => ({
        done: true,
        data: ObjectId(data)
      })
    ]
  }, {
    name: 'content',
    sanitizers: [
      (data, origin) => {
        if(origin.media_type != MESSAGE_MEDIA_TYPE.TEXT) {
          return {
            done: true,
            data: ObjectId(data)
          }
        }
        return {
          done: true ,
          data 
        }
      }
    ]
  }, {
    name: 'media_type',
    sanitizers: [
      data => {
        return {
          done: true,
          data: data.toUpperCase()
        }
      }
    ]
  },
  {
    name: 'point_to',
    sanitizers: [
      data => {
        try {
          return {
            done: true,
            data: ObjectId(data)
          }
        }catch(err) {
          return {
            done: false
          }
        } 
      }
    ]
  }, true)
  
  const [, token] = verifyTokenToData(ctx)
  const { id } = token
  const objId = ObjectId(id)
  let messageId 

  let initData = {
    message_type: MESSAGE_TYPE.ORIGIN,
    media_type,
    room: _id,
    content: {
      [MEDIA_MAP[media_type]]: content 
    },
  }
  if(!!point_to) {
    initData.point_to = point_to
  }

  const data = await MemberModel.findOne({
    user: objId
  })
  .select({
    _id: 1,
  })
  .exec()
  .then(notFound)
  .then(data => {
    const { _id } = data 
    initData.user_info = _id 
    const model = new MessageModel(initData)
    return model.save()
  })
  .then(data => {
    const { _id: message } = data
    messageId = message 
    return RoomModel.updateOne({
      _id,
      type: ROOM_TYPE.SYSTEM,
      origin: true 
    }, {
      $push: {
        message
      }
    }) 
  })  
  .then(_ => ({ data: { _id: messageId } }))
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data,
    needCache: false
  })
})
.delete('/', async(ctx) => {
  const check = Params.query(ctx, {
    name: '_id',
    validator: [
      data => {
        if(typeof data !== 'string' || !data.length) return false 
        const lists = data.split(',')
        return lists.every(item => ObjectId.isValid(item.trim()))
      }
    ]
  })

  if(check) return 

  const [ _ids, type ] = Params.sanitizers(ctx.query, {
    name: '_id',
    sanitizers: [
      data => {
        return data.split(',').map(item => ObjectId(item.trim()))
      }
    ]
  }, {
    name: 'type',
    sanitizers: [
      data => {
        return parseInt(data) === 1
      }
    ]
  })

  async function deleteMessage() {
    return Promise.all([
      RoomModel.updateOne({
        type: ROOM_TYPE.SYSTEM,
        origin: true,
        message: {
          $in: _ids
        }
      }, {
        $pullAll: {
          message: _ids
        }
      }),
      MessageModel.deleteMany({
        _id: { $in: _ids }
      })
      .then(data => {
        if(data.deletedCount === 0) return Promise.reject({ errMsg: 'not found', status: 404 })
      }),
    ])
    .then(_ => ({ data: { data: null } }))
  }

  async function deleteRoomMessage() {
    return RoomModel.findOneAndUpdate({
      _id: _ids[0],
      type: ROOM_TYPE.SYSTEM,
      origin: true,
    }, {
      $set: {
        message: []
      }
    })
    .select({
      _id: 1
    })
    .exec()
    .then(notFound)
    .then(data => {
      const { _id } = data
      return MessageModel.deleteMany({
        room: _id 
      }) 
    })
    .then(data => {
      if(data.nModified === 0) return Promise.reject({ errMsg: 'not found', status: 404 })
      return {
        data: {
          data: null
        }
      }
    })
  }
  
  const data = await (type ? deleteRoomMessage() : deleteMessage())
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data,
    needCache: false
  })
})

module.exports = router