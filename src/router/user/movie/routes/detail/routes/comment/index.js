const Router = require('@koa/router')
const List = require('./list')
const Detail = require('./detail')
const { MongoDB } = require('@src/utils')

const router = new Router()
const mongo = MongoDB()

router
.get('/', async (ctx) => {
  const { _id, count=20 } = ctx.query
  let res
  let result
  let errMsg
  const data = await mongo.connect("movie")
  .then(db => db.findOne({
    _id: mongo.dealId(_id)
  }, {
    projection: {
      comment: 1
    }
  }))
  .then(data => {
    const { comment } = data
    return mongo.connect("comment")
    .then(db => db.find({
      _id: { $in: [...comment] }
    }, {
      projection: {
        "content.text": 1,
        user_info: 1,
      },
      limit: count
    }))
  })
  .then(data => data.toArray())
  .then(data => {
    result = [...data]
    return mongo.connect("user")
    .then(db => db.find({
      _id: { $in: data.map(d => d.user_info) }
    }, {
      projection: {
        avatar: 1,
        _id: 0
      }
    }))
    .then(data => data.toArray())
  })
  .then(data => {
    result.forEach((r, i) => {
      let [avatar] = data.filter(d => mongo.equalId(d._id, r.user_info))
      const { _id, ...nextData } = avatar
      result[i]['user_info'] = {
        _id: r.user_info,
        ...nextData
      }
    })
    return result
  })
  .catch(err => {
    console.log(err)
    errMsg = err
    return false
  })
  
  if(errMsg) {
    res = {
      success: false,
      res: {
        errMsg
      }
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