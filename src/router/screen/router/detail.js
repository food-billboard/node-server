const Router = require('@koa/router')
const { verifyTokenToData, dealErr, Params, responseDataDeal, ScreenModal, notFound, getCookie } = require('@src/utils')
const { Types: { ObjectId } } = require('mongoose')
const { getUserAgent, SHARE_COOKIE_KEY } = require('./constants')

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

  const [, token] = verifyTokenToData(ctx)
  let isValid = !!token  
  const agentHeaderData = getUserAgent(ctx)
  const agentCookie = getCookie(ctx, SHARE_COOKIE_KEY)
  isValid = isValid || agentHeaderData === agentCookie

  const { _id } = ctx.query

  const data = await new Promise((resolve, reject) => {
    if(isValid) {
      resolve()
    }else {
      reject({ status: 403, errMsg: 'forbidden' })
    }
  })
  .then(_ => {
    return ScreenModal.findOne({
      _id: ObjectId(_id),
    })
    .select({
      _id: 1,
      data: 1,
      name: 1,
      poster: 1,
      description: 1
    })
    .exec()
  })
  .then(notFound)
  .then((result) => {

    const { data, _id, name, poster, description } = result 

    return {
      data: {
        _id, 
        name, 
        poster, 
        description,
        components: JSON.parse(data)
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