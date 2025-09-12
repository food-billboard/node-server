const Router = require('@koa/router')
const { Types: { ObjectId } } = require('mongoose')
const Day = require('dayjs')
const { MEDIA_MAP } = require('../../utils')
const { Auth } = require('../auth')
const { dealErr, responseDataDeal, Params, MEDIA_AUTH, MEDIA_STATUS, MEDIA_ORIGIN_TYPE, STATIC_FILE_PATH, notFound } = require('@src/utils')

const router = new Router()

router
//权限判断
.use(Auth)
.get('/', async (ctx) => {
  const check = Params.query(ctx, {
    name: 'type',
    validator: [
      data => !!MEDIA_MAP[data]
    ]
  })
  if(check) return 

  const { type } = ctx.query
  const model = MEDIA_MAP[type]
  const { currPage, pageSize, ...nextParams } = Params.sanitizers(ctx.query, {
    name: '_id',
    sanitizers: [
      data => {
        if(data.split(',').every(item => ObjectId.isValid(item.trim()))) return {
          done: true,
          data: {
            _id: { $in: data.split(',').map(item => ObjectId(item.trim())) }
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
        // name userid md5 mime src
        if(typeof data === 'string' && !!data.length) {

          function reg(content) {
            return {
              $regex: content,
              $options: 'gi'
            }
          }

          let filter = [
            {
              name: reg(data)
            },
            {
              "info.md5": reg(data)
            },
            {
              "info.mime": reg(data)
            },
            {
              src: reg(data)
            },
          ]
          if(ObjectId.isValid(data)) filter.push(            {
            origin: ObjectId(data)
          })

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
  }, {
    name: 'origin_type',
    sanitizers: [
      data => {
        if(typeof data === 'string' && !!MEDIA_ORIGIN_TYPE[data.trim().toUpperCase()]) return {
          done: true,
          data: {
            origin_type: data.trim().toUpperCase()
          }
        }
        return {
          done: false 
        }
      }
    ]
  }, {
    name: 'auth',
    sanitizers: [
      data => {
        if(typeof data === 'string' && !!MEDIA_AUTH[data.trim().toUpperCase()]) return {
          done: true,
          data: {
            auth: data.trim().toUpperCase()
          }
        }
        return {
          done: false 
        }
      }
    ]
  }, {
    name: 'status',
    sanitizers: [
      data => {
        if(typeof data === 'string' && !!MEDIA_STATUS[data.trim().toUpperCase()]) return {
          done: true,
          data: {
            "info.status": data.trim().toUpperCase()
          }
        }
        return {
          done: false 
        }
      }
    ]
  }, {
    name: 'size',
    sanitizers: [
      data => {
        // size 0 0,10 10,
        let result = {
          done: false,
          data: null
        }
        if(typeof data === 'number' || typeof data === 'string' && !data.includes(',') && !Number.isNaN(parseInt(data))) {
          result.done = true 
          result.data = {
            "info.size": parseInt(data)
          }
        }else if(typeof data === 'string') {
          const [ min, max ] = data.split(',').map(item => parseInt(item.trim()))
          if(!Number.isNaN(min)) {
            result.done = true 
            result.data = {
              "info.size": {
                $gte: min,
                ...(Number.isNaN(max) ? {} : { $lte: max }) 
              }
            }
          }
        }
        return result
      }
    ]
  }, {
    name: 'currPage',
    _default: 0,
    sanitizers: [
      data => ({
        done: true,
        data: data >= 0 ? +data : 0
      })
    ]
  }, {
    name: 'pageSize',
    _default: 30,
    sanitizers: [
      data => ({
        done: true,
        data: data >= 0 ? +data : 30
      })
    ]
  }, {
    name: 'start_date',
    sanitizers: [
      data => {
        if(typeof data === 'string' && !!data) return {
          done: true,
          data: {
            createdAt: {
              $gte: Day(data)
            }
          }
        }
        return {
          done: false 
        }
      }
    ]
  }, {
    name: 'end_date',
    sanitizers: [
      data => {
        if(typeof data === 'string' && !!data) return {
          done: true,
          data: {
            createdAt: {
              $gte: Day(data)
            }
          }
        }
        return {
          done: false 
        }
      }
    ]
  }, {
    name: 'expire',
    sanitizers: [
      data => {
        if(typeof data === 'string' && !!data) return {
          done: true,
          data: {
            expire: {
              $lte: Day(data)
            }
          }
        }
        return {
          done: false 
        }
      }
    ]
  }, true)

  const query = Object.values(nextParams).reduce((acc, cur) => {
    acc = {
      ...acc,
      ...cur,
    }
    return acc 
  }, {})

  let videoConfig = [
    {
      $lookup: {
        from: 'images',
        localField: 'poster',
        foreignField: '_id',
        as: 'poster'
      }
    },
    {
      $unwind: {
        path: "$poster",
        preserveNullAndEmptyArrays: true 
      }
    },
  ]

  const aggregate = [
    {
      $sort: {
        createdAt: -1 
      }
    },
    {
      $match: query
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
        localField: 'origin',
        foreignField: '_id',
        as: 'origin'
      }
    },
    {
      $unwind: {
        path: "$origin",
        preserveNullAndEmptyArrays: true 
      }
    },
    ...(type == 1) ? videoConfig : [],
    {
      $project: {
        expire:1 ,
        file_name: 1,
        description: 1,
        _id: 1,
        createdAt: 1,
        updatedAt: 1,
        src: 1,
        name: 1,
        origin_type: 1,
        auth: 1,
        ...(type == 1 ? {
          poster: "$poster.src"
        } : {}),
        white_list_count: {
          $size: {
            $ifNull: [
              "$white_list", []
            ]
          }
        },
        info: {
          md5: "$info.md5",
          status: "$info.status",
          size: "$info.size",
          mime: "$info.mime"
        },
        origin: {
          _id: "$origin._id",
          name: "$origin.username"
        }
      }
    }
  ]

  const data = await Promise.all([
    model.aggregate([
      {
        $match: query
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
    model.aggregate(aggregate)
  ])
  .then(([total, data]) => {
    return {
      data: {
        list: data,
        total: !!total.length ? total[0].total || 0 : 0,
      }
    }
  })
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    needCache: true,
    data
  })

})
.put('/', async (ctx) => {
  const check = Params.body(ctx, {
    name: '_id',
    validator: [
      data => ObjectId.isValid(data)
    ]
  }, {
    name: 'type',
    validator: [
      data => !!MEDIA_MAP[data]
    ]
  })
  if(check) return 
  const { request: { body: { type } } } = ctx
  const model = MEDIA_MAP[type]
  const { _id, ...setFields } = Params.sanitizers(ctx.request.body, {
    name: '_id',
    sanitizers: [
      data => ({
        done: true,
        data: ObjectId(data)
      })
    ]
  }, {
    name: 'name',
    sanitizers: [
      data => {
        if(typeof data === 'string' && !!data.length) return {
          done: true,
          data: {
            name: data
          }
        }
        return {
          done: false
        }
      }
    ]
  }, {
    name: 'file_name',
    sanitizers: [
      data => {
        if(typeof data === 'string' && !!data.length) return {
          done: true,
          data: {
            file_name: data
          }
        }
        return {
          done: false
        }
      }
    ]
  }, {
    name: 'description',
    sanitizers: [
      data => {
        if(typeof data === 'string' && !!data.length) return {
          done: true,
          data: {
            description: data
          }
        }
        return {
          done: false
        }
      }
    ]
  }, {
    name: 'auth',
    sanitizers: [
      data => {
        if(typeof data === 'string' && !!MEDIA_AUTH[data]) return {
          done: true,
          data: {
            auth: data
          }
        }
        return {
          done: false
        }
      }
    ]
  }, {
    name: 'status',
    sanitizers: [
      data => {
        if(typeof data === 'string' && !!MEDIA_STATUS[data]) return {
          done: true,
          data: {
            "info.status": data
          }
        }
        return {
          done: false
        }
      }
    ]
  }, {
    name: 'expire',
    sanitizers: [
      data => {
        if(typeof data === 'string') return {
          done: true,
          data: !!data ? {
            expire: Day(data).toDate()
          } : {
            $unset: {
              expire: 1
            }
          }
        }
        return {
          done: false
        }
      }
    ]
  }, true)

  const data = await model.findOneAndUpdate({
    _id
  }, {
    $set: Object.values(setFields).reduce((acc, cur) => {
      acc = {
        ...acc,
        ...cur
      }
      return acc 
    }, {})
  })
  .select({
    _id: 1
  })
  .exec()
  .then(notFound)
  .then(data => ({ data: { _id: data._id } }))
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data,
    needCache: false
  })

})
.delete('/', async (ctx) => {
  const check = Params.query(ctx, {
    name: '_id',
    validator: [
      data => data.split(',').every(item => ObjectId.isValid(item.trim()))
    ]
  }, {
    name: 'type',
    validator: [
      data => !!MEDIA_MAP[data]
    ]
  })
  if(check) return 

  const { type } = ctx.query
  const [ _ids ] = Params.sanitizers(ctx.query, {
    name: '_id',
    sanitizers: [
      data => data.split(',').map(item => ObjectId(item.trim()))
    ]
  })
  const model = MEDIA_MAP[type]

  const data = await model.deleteMany({
    _id: { $in: _ids }
  })
  .then(data => {
    if(data.deletedCount === 0) return Promise.reject({ errMsg: 'not found', status: 404 })
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