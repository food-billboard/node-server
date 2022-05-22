const Router = require('@koa/router')
const { dealErr, Params, responseDataDeal, ScreenModal, ScreenModelModal, verifyTokenToData, OtherMediaModel, notFound, STATIC_FILE_PATH_NO_WRAPPER } = require('@src/utils')
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

  const data = await OtherMediaModel.findOne({
    _id,
  })
  .select({
    src: 1
  })
  .exec()
  .then(notFound)
  .then(data => {
    const { src } = data 
    filePath = src 
    return fs.readJSON(path.join(STATIC_FILE_PATH_NO_WRAPPER, src))
  })
  .then(data => {
    const { _id, ...nextData } = data 
    const newData = new model({
      ...nextData,
      user: ObjectId(id)
    })
    return newData.save() 
  })
  .then(data => {
    return {
      data: data._id 
    }
  })
  .catch(dealErr(ctx))

  if(data && !data.err) {
    try {
      await fs.unlink(path.join(STATIC_FILE_PATH_NO_WRAPPER, filePath))
      await OtherMediaModel.deleteOne({ _id })
    }catch(err) {}
  }

  responseDataDeal({
    ctx,
    data
  })

})

module.exports = router