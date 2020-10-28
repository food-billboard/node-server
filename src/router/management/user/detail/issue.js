const Router = require('@koa/router')
const { UserModel, dealErr, notFound, Params, responseDataDeal } = require('@src/utils')
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

router
//上传电影列表
.get('/', async(ctx) => {

  const check = Params.query(ctx, {
    name: '_id',
    type: [ 'isMongoId' ]
  })

  if(check) return

  const [ currPage, pageSize, _id ] = Params.sanitizers(ctx.query, {
    name: 'currPage',
    _default: 0,
    type: ['toInt'],
    sanitizers: [
      data => data >= 0 ? data : -1
    ]
  }, {
    name: 'pageSize',
    _default: 30,
    type: ['toInt'],
    sanitizers: [
      data => data >= 0 ? data : -1
    ]
  }, {
    name: '_id',
    sanitizers: [
      data => ObjectId(data)
    ]
  })

  const data = await UserModel.findOne({
    _id
  })
  .select({
    _id: 0,
    issue: 1
  })
  .populate({

  })
  .exec()
  .then(data => !!data && data._doc)
  .then(notFound)
  .then(data => {

  })
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data,
    needCache: false
  })

})

module.exports = router