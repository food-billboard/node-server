const Router = require('@koa/router')
const { Types: { ObjectId } } = require('mongoose')
const { RoomModel, MemberModel, Params, notFound, ROOM_TYPE, dealErr, responseDataDeal } = require('@src/utils')

const router = new Router()

router
.get('/', async (ctx) => {

  const { currPage, pageSize, ...query } = Params.sanitizers(ctx.query, {
    name: '_id',
    sanitizers: [
      data => {
        try {
          if(!ObjectId.isValid(data)) return {
            done: false 
          }
          return {
            done: true,
            data: {
              _id: ObjectId(data)
            }
          }
        }catch(err) {
          return {
            done: false 
          }
        }
      }
    ]
  }, {
    name: 'room',
    sanitizers: [
      data => {
        try {
          if(!ObjectId.isValid(data)) return {
            done: false 
          }
          return {
            done: true,
            data: {
              room: {
                $in: [
                  ObjectId(data)
                ]
              }
            }
          }
        }catch(err) {
          return {
            done: false 
          }
        }
      }
    ]
  }, {
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
  }, true)

  const match = Object.values(query).reduce((acc, cur) => {
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

  const data = await Promise.all([
    MemberModel.aggregate([
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
    MemberModel.aggregate([
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
          let: { user: "$user" }, 
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [ "$_id", "$$user" ]
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
              $lookup: {
                from: 'friends',
                as: 'friends',
                foreignField: "user",
                localField: "_id"
              }
            },
            {
              $unwind: {
                path: "$friends",
                preserveNullAndEmptyArrays: true 
              }
            },
            {
              $project: {
                _id: 1,
                avatar: "$avatar.src",
                username: 1,
                description: 1,
                friend_id: "$friends._id"
              }
            }
          ],
          as: "user"
        }
      },
      {
        $unwind: {
          path: "$user",
          preserveNullAndEmptyArrays: true 
        }
      },
      {
        $lookup: {
          from: 'rooms',
          localField: 'room', 
          foreignField: '_id', 
          as: 'room'
        }
      },
      {
        $project: {
          _id: 1,
          user: "$user",
          sid: 1,
          temp_user_id: 1,
          createdAt: 1,
          updatedAt: 1,
          room: {
            $map: {
              "input":"$room",
              "as":"roomItem", 
              "in":{ 
                name: "$$roomItem.info.name",
                description: "$$roomItem.info.description",
                _id: "$$roomItem._id"
              }
            }
          }
        }
      },
    ]),
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
    ctx,
    data,
    needCache: false 
  })
})
.post('/', async (ctx) => {
  const check = Params.body(ctx, {
    name: '_id',
    validator: [
      (data) => {
        return data.split(',').every(item => ObjectId.isValid(item.trim()))
      }
    ]
  },
  {
    name: 'room',
    validator: [
      data => ObjectId.isValid(data)
    ]
  })

  if(check) return 

  const [ _id, room ] = Params.sanitizers(ctx.request.body, {
    name: '_id',
    sanitizers: [
      data => data.split(',').map(item => ObjectId(item.trim()))
    ]
  }, {
    name: 'room',
    sanitizers: [
      data => ObjectId(data)
    ]
  })

  const data = await RoomModel.findOneAndUpdate({
    _id: room,
    origin: true,
    type: ROOM_TYPE.SYSTEM
  }, {
    $push: {
      members: {
        $each: _id
      } 
    }
  })
  .select({
    _id: 1,
  })
  .exec()
  .then(notFound)
  .then(_ => {
    return MemberModel.updateMany({
      _id: {
        $in: _id
      },
    }, {
      $addToSet: {
        room: room
      }
    })
  })
  .then(data => {
    if(!data || data.nModified == 0) return Promise.reject({ errMsg: 'not Found', status: 404 })
    return {
      data: room.toString()
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
    multipart: true,
    validator: [
      (data, origin) => {
        if(origin.is_delete === undefined && !data) return false 
        if(parseInt(origin.is_delete) === 1) return true 
        const list = data.split(',')
        return list.every(item => ObjectId.isValid(item.trim())) && !!list.length
      }
    ]
  }, {
    name: 'room',
    validator: [
      data => {
        return ObjectId.isValid(data)
      }
    ]
  })

  if(check) return 

  const [ _id, room ] = Params.sanitizers(ctx.query, {
    name: '_id',
    sanitizers: [
      (data, origin) => {
        if(origin.is_delete === undefined && !data) return false 
        if(parseInt(origin.is_delete) == 1) return false 
        const list = data.split(',').map(item => ObjectId(item.trim()))
        return list 
      }
    ]
  }, {
    name: 'room',
    sanitizers: [
      data => {
        return ObjectId(data)
      }
    ]
  })

  const update = _id ? {
    $pullAll: {
      members: _id 
    }
  } : {
    $set: {
      members: []
    }
  }
  
  const data = await RoomModel.updateOne({
    _id: room,
    origin: true,
    type: ROOM_TYPE.SYSTEM
  }, update)
  .then(data => {
    if(data.nModified === 0) return Promise.reject({ errMsg: 'not found', status: 404 })
  })
  .then(_ => {
    const query = _id ? {
      _id: {
        $in: _id
      }
    } : {
      room: {
        $in: [room]
      }
    }
    return MemberModel.updateMany(query, {
      $pull: {
        room
      }
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
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data,
    needCache: false
  })
})

module.exports = router