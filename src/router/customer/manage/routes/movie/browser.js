const Router = require('@koa/router')
const { verifyTokenToData, UserModel, dealErr } = require("@src/utils")

const router = new Router()

router.get('/', async (ctx) => {
  const { currPage=0, pageSize=30 } = ctx.query
  const [, token] = verifyTokenToData(ctx)
  const { mobile } = token
  let res 

  const data = await UserModel.findOne({
    mobile: ~~mobile
  })
  .select({
    glance: 1
  })
  .populate({
    path: 'glance',
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
    const { glance } = data
    return {
      glance: glance.map(g => {
        const { info: { description, name }, ...nextD } = g
        return {
          ...nextD,
          description,
          name,
        }
      })
    }
  })
  .catch(dealErr(ctx))

  // let errMsg
  // const data = await mongo.connect("user")
  // .then(db => db.findOne({
  //   mobile: Number(mobile)
  // }, {
  //   projection: {
  //     glance: 1
  //   }
  // }))
  // //查找电影详情
  // .then(data => {
  //   if(data && data.glance && !data.glance.length) return Promise.reject({err: null, data: []})
  //   const { glance } = data
  //   return mongo.connect("movie")
  //   .then(db => db.find({
  //     _id: { $in: [...glance] }
  //   }, {
  //     limit: pageSize,
  //     skip: pageSize * currPage,
  //     projection: {
  //       "info.description": 1,
  //       "info.name": 1,
  //       poster: 1
  //     }
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
  //   if(isType(err, "object") && err.data) return err.data
  //   console.log(err)
  //   errMsg = err
  //   return false
  // })

  if(data && data.err) {
    res = {
      ...data.ers
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