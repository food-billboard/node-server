const Router = require('@koa/router')
const { Types: { ObjectId } } = require('mongoose')
const fs = require('fs')
const path = require('path')
const { ImageModel, VideoModel, OtherMediaModel, dealErr, responseDataDeal, Params, MEDIA_AUTH, MEDIA_STATUS, MEDIA_ORIGIN_TYPE, STATIC_FILE_PATH} = require('@src/utils')

const router = new Router()

const MEDIA_MAP = {
  0: ImageModel,
  1: VideoModel,
  2: OtherMediaModel
}

router
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
        if(data.every(item => ObjectId.isValid(item.trim()))) return {
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
        if(typeof data === 'string' && !!MEDIA_ORIGIN_TYPE[data.trim().toLowerCase()]) return {
          done: true,
          data: {
            origin_type: data.trim().toLowerCase()
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
        if(typeof data === 'string' && !!MEDIA_AUTH[data.trim().toLowerCase()]) return {
          done: true,
          data: {
            auth: data.trim().toLowerCase()
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
        if(typeof data === 'string' && !!MEDIA_STATUS[data.trim().toLowerCase()]) return {
          done: true,
          data: {
            "info.status": data.trim().toLowerCase()
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
        if(typeof data === 'number') {
          result.done = true 
          result.data = {
            "info.size": data
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
  })

  const query = Object.values(nextParams).reduce((acc, cur) => {
    acc = {
      ...acc,
      ...cur,
    }
    return acc 
  }, {})

  const aggregate = [
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
    {
      $project: {
        _id: 1,
        createdAt: 1,
        updatedAt: 1,
        src: 1,
        name: 1,
        origin_type: 1,
        auth: 1,
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
    data: {
      data: {
        total: (total[0] || { total: 0 }).total,
        list: data
      }
    }
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
  const setFields = Params.sanitizers(ctx.request.body, {
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
          data
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
          data
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
          data
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
    $set: setFields
  })
  .select({
    _id: 1
  })
  .exec()
  .then(data => !!data && data._doc)
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
.get('/valid', async (ctx) => {

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

  const { type, isdelete } = ctx.query
  const [ _ids ] = Params.sanitizers(ctx.query, {
    name: '_id',
    sanitizers: [
      data => data.split(',').map(item => ObjectId(item.trim()))
    ]
  })
  const _isdelete = typeof isdelete === 'boolean' ? isdelete : false 
  const model = MEDIA_MAP[type]
  let logs = {
    databaseExists: false ,
    databaseStatus: null,
    exists: false 
  }
  let filePath = null 

  const data = await model.findOne({
    _id,
    "info.status": MEDIA_STATUS.UPLOADING
  })
  .select({
    _id: 1,
    src: 1,
    "info.status": 1
  })
  .exec()
  .then(data => !!data && data._doc)
  .then(data => {
    if(!data) return false 
    logs.databaseExists = true 
    const { src, info: { status } } = data
    logs.databaseStatus = status 
    const [ ,, type, fileName ] = src.split('/')
    let isExists = false 
    filePath = path.join(STATIC_FILE_PATH, type, fileName)
    try {
      isExists = fs.existsSync(filePath)
    }finally {
      logs.exists = isExists
    }

    let result = {
      complete: false,
      error: true
    }

    if(logs.databaseExists || logs.databaseStatus === MEDIA_STATUS.ERROR || !logs.exists) return result 
    result.complete = logs.databaseStatus === MEDIA_STATUS.COMPLETE 
    result.complete = false 
    return result 
  })
  .then(result => {
    if(result.error && _isdelete) {
      return Promise.all([
        model.deleteOne({
          _id,
        }),
        fs.promises.unlink(filePath)
      ])
      .then(_ => ({ data: result }))
    }

    return {
      data: result
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