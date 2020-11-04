const Router = require('@koa/router')
const { ActorModel, dealErr, notFound, Params, responseDataDeal } = require('@src/utils')
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

  const data = await ActorModel.findOne({
    _id
  })
  .select({
    _id: 1,
    other: 1,
    name: 1,
    createdAt: 1,
    updatedAt: 1,
    source_type: 1
  })
  .exec()
  .then(data => !!data && data._doc)
  .then(notFound)
  .then(data => {
    const { name, other: { another_name, avatar }, createdAt, updatedAt, source_type } = data

    // {
    //   data: {
    //     name,
    //     another_name,
    //     avatar,
    //     _id,
    //     createdAt,
    //     updatedAt,
    //     source_type
    //   }
    // }

    return {
      data: {
        name,
        another_name,
        avatar: avatar ? avatar.src : null,
        _id,
        createdAt,
        updatedAt,
        source_type
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
.post('/', async(ctx) => {
  
})
.put('/', async(ctx) => {
  
  const [ _id ] = Params.sanitizers(ctx.body, {
    name: '_id',
    sanitizers: [
      data => ObjectId(data)
    ]
  })

})
.delete('/', async(ctx) => {
  
  const [ _id ] = Params.sanitizers(ctx.query, {
    name: '_id',
    sanitizers: [
      data => ObjectId(data)
    ]
  })

})

module.exports = router