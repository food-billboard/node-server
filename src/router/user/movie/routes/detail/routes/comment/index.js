const Router = require('@koa/router')
const List = require('./list')
const Detail = require('./detail')
const { MovieModel, dealErr } = require('@src/utils')
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

router
.get('/', async (ctx) => {
  const { _id, count=20 } = ctx.query
  let res
  const data = await MovieModel.findOne({
    _id: ObjectId(_id)
  })
  .select({
    comment: 1
  })
  .populate({
    path: 'comment',
    select: {
      "content.text": 1,
      user_info: 1,
    },
    options: {
      limit: count
    },
    populate: {
      path: 'user_info',
      select: {
        avatar: 1,
        _id: 1
      }
    }
  })
  .catch(dealErr(ctx))

  // let result
  // let errMsg
  // const data = await mongo.connect("movie")
  // .then(db => db.findOne({
  //   _id: mongo.dealId(_id)
  // }, {
  //   projection: {
  //     comment: 1
  //   }
  // }))
  // .then(data => {
  //   const { comment } = data
  //   return mongo.connect("comment")
  //   .then(db => db.find({
  //     _id: { $in: [...comment] }
  //   }, {
  //     projection: {
  //       "content.text": 1,
  //       user_info: 1,
  //     },
  //     limit: count
  //   }))
  // })
  // .then(data => data.toArray())
  // .then(data => {
  //   result = [...data]
  //   return mongo.connect("user")
  //   .then(db => db.find({
  //     _id: { $in: data.map(d => d.user_info) }
  //   }, {
  //     projection: {
  //       avatar: 1,
  //       _id: 1
  //     }
  //   }))
  //   .then(data => data.toArray())
  // })
  // .then(data => {
  //   result.forEach((r, i) => {
  //     let [avatar] = data.filter(d => mongo.equalId(d._id, r.user_info))
  //     const { _id, ...nextData } = avatar
  //     result[i]['user_info'] = {
  //       _id: r.user_info,
  //       ...nextData
  //     }
  //   })
  //   return result.map(r => {
  //     const { _id, user_info, ...nextR } = r
  //     const { _id:userId, ...nextUserInfo } = user_info
  //     return {
  //       ...nextR,
  //       user_info: {
  //         ...nextUserInfo
  //       }
  //     }
  //   })
  // })
  // .catch(err => {
  //   console.log(err)
  //   errMsg = err
  //   return false
  // })
  
  if(data & data.err) {
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
.use('/list', List.routes(), List.allowedMethods())
.use('/detail', Detail.routes(), Detail.allowedMethods())

module.exports = router