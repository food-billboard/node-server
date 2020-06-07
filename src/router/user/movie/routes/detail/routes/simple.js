const Router = require('@koa/router')
const { MovieModel, dealErr } = require("@src/utils")
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

router.get('/', async (ctx) => {
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
  .then(data => data)
  .catch(dealErr(ctx))

  // let errMsg
  // const data = await mongo.connect("movie")
  // .then(db => db.findOne({
  //   _id: mongo.dealId(_id)
  // }, {
  //   projection: {
  //     poster: 1,
  //     name: 1,
  //     "info.description": 1
  //   }
  // }))
  // .catch(err => {
  //   errMsg = err
  //   return false
  // })

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