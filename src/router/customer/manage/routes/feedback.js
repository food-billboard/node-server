const Router = require('@koa/router')
const { verifyTokenToData, UserModel, FeedbackModel, dealErr, notFound, Params, formatISO, NUM_DAY, responseDataDeal } = require("@src/utils")
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

router
.use(async(ctx, next) => {
  const { url } = ctx

  const [, token] = verifyTokenToData(ctx)
  const { mobile } = token

  let data = await UserModel.findOne({
    mobile: Number(mobile)
  })
  .select({
    _id: 1
  })
  .exec()
  .then(data => !!data && data._id)
  .then(notFound)
  .then(id => {
    userId = id
    return FeedbackModel.findOne({
      user_info: id,
      createdAt: { $lt: formatISO(Date.now() - NUM_DAY(1)) }
    })
    .select({
      _id: 1
    })
    .exec()
  })
  .then(data => !!data && data._id)
  .catch(dealErr(ctx))

  if(data && !data.err) {
    ctx.status = 503
    data = {
      success: false,
      res: {
        errMsg: 'frequent'
      }
    }
  }

  if(data) {
    responseDataDeal({
      ctx,
      data
    })
    return
  }

  if(!/.+\/feedback$/g.test(url)) return await next()

  const check = Params.body(ctx, {
    name: "content",
    validator: [
      data => !!Object.keys(data).length && ( 
        !!data.text.length
        ||
        ( data.video ? data.video.every(d => ObjectId.isValid(d)) && !!data.video.length : true )
        ||
        ( data.image ? data.image.every(d => ObjectId.isValid(d)) && !!data.image.length : true )
      )
    ]
  })

  if(check) return

  return await next()
})
.post('/', async(ctx) => {
  const { body: { content: {
    text='',
  } } } = ctx.request
  const [ image, video ] = Params.sanitizers(ctx.request.body, 
  {
    name: 'content.image',
    sanitizers: [
      data => data ? data.map(d => ObjectId(d)) : []
    ]
  },
  {
    name: 'content.video',
    sanitizers: [
      data => data ? data.map(d => ObjectId(d)) : []
    ]
  })
  const [, token] = verifyTokenToData(ctx)
  const { mobile } = token

  const data = await UserModel.findOne({
    mobile: Number(mobile)
  })
  .select({
    _id: 1
  })
  .exec()
  .then(data => !!data && data._id)
  .then(notFound)
  .then((userId) => {
    const comment = new FeedbackModel({
      user_info: userId,
      content: {
        text,
        video,
        image
      }
    })

    return comment
  })
  .then(comment => {
    return comment.save()
  })
  .then(_ => true)
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data
  })
})
.get('/precheck', async(ctx) => {

  responseDataDeal({
    ctx,
    data: true
  })
})

module.exports = router