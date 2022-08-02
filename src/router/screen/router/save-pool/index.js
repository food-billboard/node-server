const { verifyTokenToData, dealErr, Params, responseDataDeal, getClient } = require('@src/utils')
const { Types: { ObjectId } } = require('mongoose')

const savePool = async (ctx) => {

  const check = Params.body(ctx, {
    name: '_id',
    validator: [
      data => ObjectId.isValid(data)
    ]
  })

  if(check) return 

  const [, token] = verifyTokenToData(ctx)
  const { id } = token

  const { description, name, data: componentData, flag, poster, _id, version } = ctx.request.body

  const data = await ScreenModal.updateOne({
    _id: ObjectId(_id),
    user: ObjectId(id),
    enable: false 
  }, {
    $set: {
      description,
      name,
      data: componentData,
      flag,
      poster,
      version
    }
  })
  .exec()
  .then(data => {
    if(data && data.nModified == 0) return Promise.reject({ errMsg: 'forbidden', status: 403 })
    return {
      data: _id
    }
  })
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data,
    needCache: false 
  })


}

module.exports = savePool