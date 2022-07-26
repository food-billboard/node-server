const Router = require('@koa/router')
const { dealErr, Params, responseDataDeal, ScreenModelModal, notFound } = require('@src/utils')
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

router
// 详情
.get('/', async (ctx) => {

  const check = Params.query(ctx, {
    name: '_id',
    validator: [
      data => ObjectId.isValid(data)
    ]
  })

  if(check) return 

  const { _id } = ctx.query

  const data = await ScreenModelModal.findOne({
    _id: ObjectId(_id),
  })
  .select({
    _id: 1,
    data: 1,
    name: 1,
    poster: 1,
    description: 1,
    version: 1
  })
  .exec()
  .then(notFound)
  .then((result) => {

    const { data, _id, name, poster, description, version } = result 

    return {
      data: {
        _id, 
        name, 
        poster, 
        description,
        components: JSON.parse(data),
        version
      }
    }
  })
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data
  })

})

module.exports = router