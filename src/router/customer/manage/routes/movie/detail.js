const Router = require('@koa/router')
const { verifyTokenToData, UserModel, MovieModel, dealErr, notFound, Params, responseDataDeal } = require("@src/utils")
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

router
.use(async(ctx, next) => {
  const check = Params.query(ctx, {
    name: '_id',
    validator: [
			data => ObjectId.isValid(data)
		]
  })
  if(check) return

  const [ _id ] = Params.sanitizers(ctx.query, {
    name: '_id',
    sanitizers: [
      data => ObjectId(data)
    ]
  })

  const [, token] = verifyTokenToData(ctx)
  const { id } = token

  const data = UserModel.findOne({
    _id: ObjectId(id),
    "issue._id": { $in: [ _id ] }
  })
  .select({
    _id: 1
  })
  .exec()
  .then(data => !!data && data._doc._id)
  .then(notFound)
  .then(userId => {

    return MovieModel.findOne({
      _id,
      author: userId
    })
    .select({
      _id: 1
    })
    .exec()
  })
  .then(data => !!data)
  .then(notFound)
  .catch(dealErr(ctx))
  
  if(data && !data.err) {
    return await next()
  }

  responseDataDeal({
    ctx,
    data
  })

})
.get('/', async(ctx) => {

  const [ _id ] = Params.sanitizers(ctx.query, {
    name: '_id',
    sanitizers: [
      data => ObjectId(data)
    ]
  })

  const data = await MovieModel.findOne({
    _id,
  })
  .select({
    name: 1,
    info: 1,
    video: 1,
    images: 1,
    poster: 1,
    author_description: 1,
    author_rate: 1,
    updatedAt: 1
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
      data: {
        ... nextData,
        video: video ? video.src : null,
        images: images.filter(i => i && !!i.src).map(i => i.src),
        poster: poster ? poster.src : null,
        info
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