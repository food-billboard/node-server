const Router = require('@koa/router')
const {  verifyTokenToData, UserModel, dealErr } = require("@src/utils")

const router = new Router()

router.get('/', async (ctx) => {
  const { currPage=0, pageSize=30 } = ctx.query
  const [, token] = verifyTokenToData(ctx)
  const { mobile } = token

  const data = await UserModel.findOne({
    mobile: ~~mobile
  })
  .select({
    store: 1
  })
  .populate({
    path: 'store',
    select: {
      "info.description": 1,
      "info.name": 1,
      poster: 1
    },
    options: {
      limit: pageSize,
      skip: pageSize * currPage,
    }
  })
  .exec()
  .then(data => {
    const { store } = data
    return {
      store: store.map(s => {
        const { info: { description, name }, ...nextD } = s
        return {
          ...nextD,
          description,
          name,
        }
      })
    }
  })
  .catch(dealErr(ctx))

  // const data = await mongo.connect("user")
  // .then(db => db.findOne({
  //   mobile: Number(mobile)
  // }, {
  //   projection: {
  //     store: 1
  //   }
  // }))
  // .then(data => {
  //   if(data && data.store && !data.store.length) return Promise.reject({err: null, data: []})
  //   const { store } = data
  //   return mongo.connect("movie")
  //   .then(db => db.find({
  //     _id: { $in: [...store] }
  //   }, {
  //     projection: {
  //       "info.description": 1,
  //       "info.name": 1,
  //       poster: 1
  //     },
  //     limit: pageSize,
  //     skip: pageSize * currPage,
  //   }))
  //   .then(data => data.toArray())
  // })
  // .then(data => {
  //   return data.map(d => {
  //     const { info: { description, name }, ...nextD } = d
  //     return {
  //       ...nextD,
  //       description,
  //       name,
  //     }
  //   })
  // })
  // .catch(err => {
  //   if(isType(err, 'object') && err.data) return err.data
  //   console.log(err)
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