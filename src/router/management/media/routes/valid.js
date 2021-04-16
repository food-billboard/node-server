const Router = require('@koa/router')
const { Types: { ObjectId } } = require('mongoose')
const fs = require('fs')
const path = require('path')
const { MEDIA_MAP } = require('../utils')
const { dealErr, responseDataDeal, Params, MEDIA_STATUS, STATIC_FILE_PATH } = require('@src/utils')

const router = new Router()

router
.get('/', async (ctx) => {

  const check = Params.query(ctx, {
    name: '_id',
    validator: [
      data => ObjectId.isValid(data.trim())
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
      data => ObjectId(data.trim())
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
  })
  .select({
    _id: 1,
    src: 1,
    "info.status": 1
  })
  .exec()
  .then(data => !!data && data._doc)
  .then(data => {
    if(!data) return {
      complete: false,
      error: true,
      exists: false 
    } 
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
      error: true,
      exists: logs.databaseExists && logs.exists
    }

    if(!logs.databaseExists || logs.databaseStatus === MEDIA_STATUS.ERROR || !logs.exists) return result 
    result.complete = logs.databaseStatus === MEDIA_STATUS.COMPLETE 
    result.error = false 
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