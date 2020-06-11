const Router = require('@koa/router')
const { verifyTokenToData, UserModel, MovieModel, dealErr, notFound } = require("@src/utils")
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

router
.use(async(ctx, next) => {
  const [, token] = verifyTokenToData(ctx)
  const { mobile } = token
  const { _id } = ctx.query
  const data = UserModel.findOne({
    mobile: Number(mobile),
    issue: { $in: [ ObjectId(_id) ] }
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
  const { _id } = ctx.query
  let res
  const data = await MovieModel.findOne({
    _id: ObjectId(_id)
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
      info: {
        name,
        alias,
        description,
        screen_time,
        ...nextInfo  
      },
      images,
      poster: { src: posterSrc },
      video: { src: videoSrc },
      rest,
      ...nextData
    } = data
    return {
      ... nextData,
      video: videoSrc,
      images: images.filter(i => !!i.src).map(i => i.src),
      poster: posterSrc,
      info: {
        name,
        alias,
        description,
        screen_time,
        ...Object.keys(nextInfo).reduce((acc, n) => {
          acc[n] = {
            [n]: nextInfo[n],
            rest: rest[n] || []
          }
          return acc
        }, {})
      }
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