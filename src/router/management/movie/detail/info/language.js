const Router = require('@koa/router')
const { LanguageModel, dealErr, notFound, Params, responseDataDeal } = require('@src/utils')
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

router
.get('/', async(ctx) => {

  const [ _id ] = Params.sanitizers(ctx.query, {
    name: '_id',
    sanitizers: [
      data => ObjectId(data)
    ]
  })

  const data = await LanguageModel.findOne({
    _id
  })
  .select({
    _id: 1,
    name: 1,
    createdAt: 1,
    updatedAt: 1,
    source_type: 1
  })
  .exec()
  .then(data => !!data && data._doc)
  .then(notFound)
  // {
    //   data: {
    //     name,
    //     _id,
    //     createdAt,
    //     updatedAt,
    //     source_type
    //   }
    // }
  .then(data => ({ data }))
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data,
    needCache: false
  })

})
.post('/', async(ctx) => {
  
})
.put('/', async(ctx) => {
  
})
.delete('/', async(ctx) => {
  
})

module.exports = router