const Router = require('@koa/router')
const { SpecialModel, dealErr, notFound, Params } = require('@src/utils')
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

router
.get('/', async(ctx) => {
  Params.get(ctx, {
    name: '_id',
    type: ['isMongoId']
  })

  const { _id } = ctx.query
  let res
  const data = await SpecialModel.findOne({
    _id: ObjectId(_id)
  })
  .select({
    movie: 1,
    poster: 1,
    name: 1,
  })
  .populate({
    path: 'movie',
    select: {
      name: 1, 
      poster: 1, 
    }
  })
  .exec()
  .then(data => !!data && data._doc)
  .then(notFound)
  .then(data => {
    const { poster: { src }, movie, ...nextData } = data
    return {
      ...nextData,
      poster: src,
      movie: movie.map(m => {
        const { _doc: { poster: { src: icon }, ...nextM } } = m
        return {
          ...nextM,
          poster: icon
        }
      })
    }
  })
  .catch(dealErr(ctx))

  if(data && data.err) {
    res = {
      ...data.res
    }
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