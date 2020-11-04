const Router = require('@koa/router')
const { ClassifyModel, dealErr, notFound, Params, responseDataDeal } = require('@src/utils')
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

  const data = await ClassifyModel.findOne({
    _id
  })
  .select({
    _id: 1,
    name: 1,
    icon: 1,
    glance: 1,
    createdAt: 1,
    updatedAt: 1,
    source_type: 1
  })
  .exec()
  .then(data => !!data && data._doc)
  .then(notFound)
  .then(data => {
    const { name, icon, glance, createdAt, updatedAt, source_type } = data

    // {
    //   data: {
    //     name,
    //     glance,
    //     icon,
    //     _id,
    //     createdAt,
    //     updatedAt,
    //     source_type
    //   }
    // }

    return {
      data: {
        name,
        glance,
        icon: icon ? icon.src : null,
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
  
})
.delete('/', async(ctx) => {
  
})

module.exports = router