const Router = require('@koa/router')
const { Types: { ObjectId } } = require('mongoose')
const fs = require('fs')
const path = require('path')
const { omit } = require("lodash")
const { MEDIA_MAP } = require('../utils')
const { dealErr, responseDataDeal, Params, MEDIA_STATUS, STATIC_FILE_PATH, parseData } = require('@src/utils')

const router = new Router()

router
.get('/', async (ctx) => {

  const check = Params.query(ctx, {
    name: '_id',
    validator: [
      data => data.split(",").every(item => ObjectId.isValid(item.trim()))
    ]
  }, {
    name: 'type',
    validator: [
      data => !!MEDIA_MAP[data]
    ]
  })
  if(check) return 

  const { type, isdelete } = ctx.query
  const [ _id ] = Params.sanitizers(ctx.query, {
    name: '_id',
    sanitizers: [
      data => data.split(",").map(item => ObjectId(item.trim()))
    ]
  })
  const _isdelete = typeof isdelete === 'boolean' ? isdelete : false 
  const model = MEDIA_MAP[type]

  const data = await model.aggregate([
    {
      $match: {
        _id: {
          $in: _id 
        }
      },
    },
    {
      $project: {
        _id: 1,
        src: 1,
        "info.status": 1,
        name: 1
      }
    }
  ])
  .then(data => Promise.all(data.map(data => {
    let logs = {
      databaseExists: false ,
      databaseStatus: null,
      exists: false
    }
    let filePath = null 
    
    if(!data) return {
      complete: false,
      error: true,
      exists: false 
    } 
    logs.databaseExists = true 
    const { src, info: { status }, _id, name } = data
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
      error: true,
      exists: logs.databaseExists && logs.exists,
      _id,
      src,
      name,
      filePath
    }

    if(!logs.databaseExists || logs.databaseStatus === MEDIA_STATUS.ERROR || !logs.exists) return result 
    result.complete = logs.databaseStatus === MEDIA_STATUS.COMPLETE 
    result.error = false 
    return result 
  })))
  .then(result => {
    const omitResult = result.map(item => omit(item, ["filePath"]))
    const errorResult = result.filter(item => item.error)
    if(!!errorResult.length && _isdelete) {
      return Promise.all([
        model.deleteMany({
          _id: {
            $in: errorResult.map(item => item._id)
          },
        }),
        ...errorResult.map(item => fs.promises.unlink(item.filePath))
      ])
      .then(_ => ({ data: omitResult }))
    }

    return {
      data: omitResult
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