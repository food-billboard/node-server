const Router = require('@koa/router')
const { verifyTokenToData, UserModel, dealErr } = require("@src/utils")

const router = new Router()

router
.get('/', async (ctx) => {
  const [, token] = verifyTokenToData(ctx)
  const { mobile } = token
  const { currPage=0, pageSize=30 } = ctx.query
  let res

  const data = await UserModel.findOne({
    mobile: ~~mobile
  })
  .select({
    fans
  })
  .populate({
    path: 'fans',
    options: {
      limit: pageSize,
      skip: currPage * pageSize
    },
    select: {
      username: 1,
      avatar: 1
    }
  })
  .exec()
  .then(data => data)
  .catch(dealErr(ctx))

  // let errMsg
  // const data = await mongo.connect("user")
  // .then(db => db.findOne({
  //   mobile: Number(mobile)
  // }, {
  //   projection: {
  //     fans: 1
  //   }
  // }))
  // .then(data => {
  //   if(data && data.fans && !data.fans.length) return Promise.reject({err: null, data: []})
  //   const { fans } = data
  //   return mongo.connect("user")
  //   .then(db => db.find({
  //     _id: { $in: [...fans] }
  //   }, {
  //     limit: pageSize,
  //     skip: pageSize * currPage,
  //     projection: {
  //       username: 1,
  //       avatar: 1
  //     },
  //   }))
  //   .then(data => data.toArray())
  // })
  // .catch(err => {
  //   if(isType(err, 'object') && err.data) return err.data
  //   errMsg = err
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