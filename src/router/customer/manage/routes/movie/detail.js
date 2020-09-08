const Router = require('@koa/router')
const { verifyTokenToData, UserModel, MovieModel, dealErr, notFound, Params } = require("@src/utils")
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

router
.use(async(ctx, next) => {
  const [, token] = verifyTokenToData(ctx)
  const { mobile } = token
  const check = Params.query(ctx, {
    name: '_id',
    type: ['isMongoId']
  })
  if(check) {
    ctx.body = JSON.stringify({ ...check.res })
    return
  }
  const [ _id ] = Params.sanitizers(ctx.query, {
    name: '_id',
    sanitizers: [
      data => ObjectId(data)
    ]
  })
  const data = await UserModel.findOne({
    mobile: Number(mobile),
    issue: { $in: [ _id ] }
  })
  .select({
    _id: 1
  })
  .exec()
  .then(data => !!data)
  .then(notFound)
  .then(data => {
    return MovieModel.findOne({
      _id,
      author: data
    })
  })
  .select({
    _id: 1
  })
  .exec()
  .then(data => !!data)
  .then(notFound)
  .catch(dealErr(ctx))
  
  if(data && !data.err) {
    return await next()
  }

  ctx.body = JSON.stringify(data.res)
})
.get('/', async(ctx) => {

  const [ _id ] = Params.sanitizers(ctx.query, {
    name: '_id',
    sanitizers: [
      data => ObjectId(data)
    ]
  })

  let res
  const data = await MovieModel.findOne({
    _id,
  })
  .select({
    name: 1,
    info: 1,
    rest: 1,
    video: 1,
    images: 1,
    poster: 1,
    author_description: 1,
    author_rate: 1,
  })
  .exec()
  .then(data => !!data && data._doc)
  .then(notFound)
  .then(data => {
    const {
      info,
      images,
      poster,
      video,
      rest,
      ...nextData
    } = data
    return {
      ... nextData,
      video: video ? video.src : null,
      images: images.filter(i => i && !!i.src).map(i => i.src),
      poster: poster ? poster.src : null,
      info
    }
  })
  .catch(dealErr(ctx))

  if(data && data.err) {
    res = data.res
  }else {
    res = {
      success: true,
      res: {
        data
      }
    }
  }
  ctx.body = JSON.stringify(res)
})

module.exports = router