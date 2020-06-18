const Router = require('@koa/router')
const { MovieModel, dealErr, notFound, Params } = require("@src/utils")
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

router.get('/', async (ctx) => {
  Params.query(ctx, {
    name: "_id",
    type: ['isMongoId']
  })

  const { _id } = ctx.query
  let res
  const data = await MovieModel.findOne({
    _id: ObjectId(_id)
  })
  .select({
    poster: 1,
    name: 1,
    "info.description": 1
  })
  .exec()
  .then(data => !!data && data._doc)
  .then(notFound)
  .then(data => {
    const { poster: { src }, info: { description }, ...nextData } = data
    return {
      ...nextData,
      poster: src,
      description
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