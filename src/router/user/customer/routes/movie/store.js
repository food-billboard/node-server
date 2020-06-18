const Router = require('@koa/router')
const { UserModel, dealErr, notFound, Params } = require("@src/utils")
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

router
.get('/', async (ctx) => {
  Params.query(ctx, {
    name: '_id',
    type: ['isMongoId']
  })

  const { currPage=0, pageSize=30, _id } = ctx.query
  const data = await UserModel.findOne({
    _id: ObjectId(_id)
  })
  .select({
    store: 1,
    _id: 0
  })
  .populate({
    path: 'store',
    options: {
      limit: pageSize,
      skip: pageSize * currPage,
    },
    select: {
      "info.description": 1,
      "info.name": 1,
      poster: 1
    }
  })
  .exec()
  .then(data => !!data && data._doc)
  .then(notFound)
  .then(data => {
    const { store } = data
    return {
      store: store.map(s => {
        const { _doc: { poster: { src }, info: { description, name }, ...nextS } } = s
        return {
          ...nextS,
          poster: src,
          description,
          name
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