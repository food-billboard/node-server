const Router = require('@koa/router')
const { verifyTokenToData, UserModel, FeedbackModel, dealErr, notFound, Params, formatISO, NUM_DAY } = require("@src/utils")
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

router
.use(async(ctx, next) => {
  const { url } = ctx

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
  .then(id => {
    userId = id
    return FeedbackModel.findOne({
      user_info: id,
      createdAt: { $lt: formatISO(Date.now() - NUM_DAY(1)) }
    })
  })
  .select({
    _id: 1
  })
  .exec()
  .then(data => !!data && data._id)
  .catch(dealErr(ctx))

  if(data && data.err) {
    ctx.body = JSON.stringify({
      ...data.res
    })
    return
  }else if(data) {
    ctx.status = 503
    ctx.body = JSON.stringify({
      success: false,
      res: {
        errMsg: 'frequent'
      }
    })
    return
  }

  if(!/.+\/feedback$/g.test(url)) return await next()
  const check = Params.body(ctx, {
    name: "content",
    validator: [
      data => !!Object.keys(data).length && ( 
        !!data.text
        &&
        ( data.video ? data.video.every(d => ObjectId.isValid(d)) : true )
        &&
        ( data.image ? data.image.every(d => ObjectId.isValid(d)) : true )
      )
    ]
  })

  if(check) {
    ctx.body = JSON.stringify({
      ...check.res
    })
    return
  }

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
  let res

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

  if(data && data.err) {
    res = {
      ...data.res
    }
  }else {
    res = {
      success: true,
      res: null
    }
  }

  ctx.body = JSON.stringify(res)
})
.get('/precheck', async(ctx) => {
  ctx.body = JSON.stringify({
    success: true,
    res: {
      data: true
    }
  })
})

module.exports = router