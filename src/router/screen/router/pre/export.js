const Router = require('@koa/router')
const { dealErr, Params, responseDataDeal, ScreenModal, ScreenModelModal, verifyTokenToData, notFound, STATIC_FILE_PATH } = require('@src/utils')
const { Types: { ObjectId } } = require('mongoose')
const path = require('path')
const fs = require('fs-extra')

const router = new Router()

router
.post('/', async (ctx) => {

  const check = Params.body(ctx, {
    name: '_id',
    validator: [
      data => ObjectId.isValid(data)
    ]
  }, {
    name: 'type',
    validator: [
      data => {
        return (typeof data === 'string') && ['screen', 'post'].includes(data)
      }
    ]
  })

  if(check) {
    return 
  }

  const [, token] = verifyTokenToData(ctx)
  const { id } = token

  const [ _id ] = Params.sanitizers(ctx.request.body, {
    name: '_id',
    sanitizers: [
      data => ObjectId(data)
    ]
  })

  const { type } = ctx.request.body

  const model = type === 'screen' ? ScreenModal : ScreenModelModal

  let filePath 
  let fileName 

  const data = await model.findOne({
    _id,
    user: ObjectId(id)
  })
  .select({
    version: 1,
    data: 1,
    flag: 1,
    name: 1,
    poster: 1,
    description: 1
  })
  .exec()
  .then(notFound)
  .then(data => {
    const { _id, ...nextData } = data 
    fileName = encodeURIComponent(data.name) 
    filePath = path.join(STATIC_FILE_PATH, 'other', `${_id}_${Date.now()}.json`)
    fs.writeFileSync(filePath, '')
    return fs.writeJson(filePath, nextData)
  })
  .catch(dealErr(ctx))

  if(data && data.err) {
    responseDataDeal({
      ctx,
      data
    })
  }else {
    ctx.type = 'json'
    ctx.set('Content-Type', 'application/octet-stream')
    ctx.set('Content-Disposition', `attachment;filename=${fileName}.json`)
    const readStream = fs.createReadStream(filePath)
    ctx.body = readStream 
    readStream.on('end', () => {
      fs.unlink(filePath)
    })
  }

})

module.exports = router