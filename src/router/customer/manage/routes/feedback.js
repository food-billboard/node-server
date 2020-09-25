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
      user_info: userId,
      createdAt: { $gt: formatISO(Date.now() - NUM_DAY(1)) }
    })
    .select({
      _id: 1,
      createdAt: 1,

    })
    .exec()
  })
  .then(data => !!data && data)
  .then(data => {
    if(!!data) return Promise.reject({ errMsg: 'frequent', status: 503 })
  })
  .catch(dealErr(ctx))

  if(data && data.err) {
    responseDataDeal({
      ctx,
      data,
      needCache: false
    })
    return
  }

  if(!/.+\/feedback$/g.test(url)) return await next()

  const check = Params.body(ctx, {
    name: "content",
    validator: [
      data => {
        const { text, image, video } = data
        try {
          return (
            (typeof text === 'string' && text.length > 0) 
            || 
            (Array.isArray(image) && !!image.length) 
            || 
            (Array.isArray(video) && !!video.length)
          ) 
            && 
          ( 
            ( Array.isArray(video) ? video.every(d => typeof d === 'string' && ObjectId.isValid(d)) && !!video.length : true )
            ||
            ( Array.isArray(image) ? image.every(d => typeof d === 'string' && ObjectId.isValid(d)) && !!image.length : true )
          )
        }catch(err) {
          console.log(err)
          return true
        }
      }
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
      data => {
        return Array.isArray(data) ? data.map(d => ObjectId(d)) : []
      }
    ]
  },
  {
    name: 'content.video',
    sanitizers: [
      data => Array.isArray(data) ? data.map(d => ObjectId(d)) : []
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
    data: {
      data: true
    }
  })
})

module.exports = router