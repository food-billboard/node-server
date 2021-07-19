const Router = require('@koa/router')
const { Types: { ObjectId } } = require('mongoose')
const { RoomModel, MemberModel, Params, ROOM_TYPE, verifyTokenToData, dealErr, responseDataDeal, MessageModel } = require('@src/utils')

const router = new Router()

router
.get('/', async (ctx) => {

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

  if(ObjectId.isValid(_id)) match._id = ObjectId(_id)
  if(ROOM_TYPE[type]) match.type = type 
  if(parseInt(origin) === 1 || parseInt(origin) === 0) {
    match.origin = parseInt(origin) === 1
  }
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
    if(!!list.length && list.every(item => ObjectId.isValid(item.trim()))) {
      match["members"] = {
        $in: list.map(item => ObjectId(item.trim()))
      }
    }
  }

  const data = await Promise.all([
    RoomModel.aggregate([
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
    RoomModel.aggregate([
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
          from: 'members', 
          let: {
            member_id: "$create_user"
          },
          pipeline: [  
            {
              $match: {
                $expr: {
                  $eq: [
                    "$_id", "$$member_id"
                  ]
                }
              }
            },
            {
              $lookup: {
                from: 'users',
                as: 'user_info',
                let: {
                  user_id: "$user"
                },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $eq: [
                          "$_id", "$$user_id"
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
                      avatar: "$avatar.src"
                    }
                  }
                ]
              }
            },
            {
              $unwind: "$user_info"
            },
            {
              $project: {
                _id: "$user_info._id",
                member: "$user",
                username: "$user_info.username",
                description: "$user_info.description",
                avatar: "$user_info.avatar",
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
        $lookup: {
          from: 'images', 
          localField: 'info.avatar', 
          foreignField: '_id', 
          as: 'info.avatar'
        }
      },
      {
        $unwind: {
          path: "$info.avatar",
          preserveNullAndEmptyArrays: true 
        }
      },
      {
        $project: {
          _id: 1,
          createdAt: 1,
          updatedAt: 1,
          type: 1,
          origin: 1,
          delete_users: {
            $size: {
              $ifNull: [
                "$delete_users", []
              ]
            }
          },
          message: {
            $size: {
              $ifNull: [
                "$message", []
              ]
            }
          },
          create_user: {
            username: "$create_user.username",
            avatar: "$create_user.avatar",
            _id: "$create_user._id",
            description: "$create_user.description",
            member: "$create_user.member"
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
          online_members: {
            $size: {
              $ifNull: [
                "$online_members", []
              ]
            }
          },
          is_delete: "$deleted"
        }
      }
    ])
  ])
  .then(([total_count, data]) => {
    if(!Array.isArray(total_count) || !Array.isArray(data)) return Promise.reject({ errMsg: 'data error', status: 404 })
    return {
      data: {
        total: total_count.length ? total_count[0].total || 0 : 0,
        list: data
      }
    }
  })
  .catch(dealErr(ctx))

  responseDataDeal({
    data,
    ctx,
    needCache: false 
  })

})
.post('/', async (ctx) => {
  const check = Params.body(ctx, {
    name: 'name',
    validator: [
      data => typeof data === 'string' && data.length > 0 && data.length < 30
    ]
  },
  {
    name: 'avatar',
    validator: [
      data => ObjectId.isValid(data)
    ]
  })

  if(check) return 

  const { avatar, members, description } = Params.sanitizers(ctx.request.body, {
    name: 'avatar',
    sanitizers: [
      data => ({
        done: true,
        data: ObjectId(data)
      })
    ]
  }, {
    name: 'members',
    sanitizers: [
      data => {
        try {
          const result = {
            done: true,
            data: data.split(',').map(item => ObjectId(item.trim()))
          }
          if(result.data.length == 0) return {
            done: false 
          }
          return result 
        }catch(err) {
          return {
            done: false 
          }
        }
      }
    ]
  }, {
    name: 'description',
    sanitizers: [
      data => {
        return {
          done: true,
          data: typeof data === 'string' && data.length < 30 ? data : '他什么也没有留下' 
        }
      }
    ]
  }, true)
  
  const { name } = ctx.request.body
  const [, token] = verifyTokenToData(ctx)
  const { id } = token
  const objId = ObjectId(id)

  let initData = {
    type:  ROOM_TYPE.SYSTEM,
    origin: true,
    info: {
      avatar,
      name,
      description
    },
    members: members ? members : []
  }
  let memberQuery = {}
  if(!!members) {
    memberQuery = {
      user: objId
    }
  }

  const data = await MemberModel.aggregate([
    {
      $match: memberQuery
    },
    {
      $project: {
        _id: 1,
        user: 1
      }
    }
  ])
  .then(data => {
    const targetMember = data.find(item => objId.equals(item.user))
    if(!targetMember) return Promise.reject({ status: 404, errMsg: 'not Found' })
    if(!members) {
      initData.members = data.map(item => item._id)
    }else if(!initData.members.some(item => targetMember._id.equals(item._id))){
      initData.members.push(targetMember._id)
    }
    initData.create_user = targetMember._id
    const model = new RoomModel(initData)
    return model.save()
  })
  .then(async (data) => {
    await MemberModel.updateMany({
      _id: {
        $in: data.members
      }
    }, {
      $addToSet: {
        room: data._id 
      }
    })
    return { data: { _id: data._id } }
  })
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
      data => ObjectId.isValid(data)
    ]
  })

  if(check) return 

  const { _id, ...update } = Params.sanitizers(ctx.request.body, {
    name: '_id',
    sanitizers: [
      data => ({
        done: true,
        data: ObjectId(data)
      })
    ]
  }, {
    name: 'avatar',
    sanitizers: [
      data => {
        if(ObjectId.isValid(data)) {
          return {
            done: true,
            data: {
              $set: {
                "info.avatar": data 
              }
            }
          }
        }else {
          return {
            done: false 
          }
        }
      }
    ]
  }, {
    name: 'members',
    sanitizers: [
      data => {
        try {
          const result = {
            done: true,
            data: {
              $set: {
                members: data.split(',').map(item => ObjectId(item.trim()))
              }
            }
          }
          if(result.data.$set.members.length == 0) return {
            done: false 
          }
          return result 
        }catch(err) {
          return {
            done: false 
          }
        }
      }
    ]
  }, {
    name: 'description',
    sanitizers: [
      data => {
        if(typeof data !== 'string' || !data || data.length > 30) return {
          done: false 
        }
        return {
          done: true,
          data: {
            $set: {
              "info.description": data
            } 
          }
        }
      }
    ]
  }, {
    name: 'name',
    sanitizers: [
      data => {
        if(typeof data !== 'string' || !data || data.length > 30) return {
          done: false 
        }
        return {
          done: true,
          data: {
            $set: {
              "info.name": data
            } 
          }
        }
      }
    ]
  }, true)

  let updateParams = Object.values(update).reduce((acc, cur) => {
    const [[ key, value ]] = Object.entries(cur) 
    if(!acc[key]) {
      acc[key] = value
    }else {
      acc[key] = {
        ...acc[key],
        ...value 
      }
    }
    return acc 
  }, {})
  let query = {
    _id 
  }
  try {
    const members = updateParams.$set.members
    if(Array.isArray(members)) {
      query.create_user = {
        $in: members
      }
    }
  }catch(err) {}

  const data = await RoomModel.updateOne(query, updateParams)
  .then(data => {
    if(!data || data.nModified == 0) return Promise.reject({ errMsg: 'not Found', status: 404 })
    return {
      data: {
        _id: _id.toString()
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

  const [ _ids ] = Params.sanitizers(ctx.query, {
    name: '_id',
    sanitizers: [
      data => {
        return data.split(',').map(item => ObjectId(item.trim()))
      }
    ]
  })
  
  const data = await Promise.all([
    RoomModel.deleteMany({
      _id: { $in: _ids }
    }),
    MessageModel.deleteMany({
      room: {
        $in: _ids
      }
    }),
    MemberModel.updateMany({
      room: {
        $in: _ids
      }
    }, {
      $pullAll: {
        room: _ids
      }
    })
  ])
  .then(([room]) => {
    if(room.deletedCount === 0) return Promise.reject({ errMsg: 'not found', status: 404 })
    return {
      data: {
        data: null
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