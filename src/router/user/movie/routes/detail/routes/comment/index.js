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
  const data = await mongo.findOne("movie", {//_movie_
    _id: mongo.dealId(_id)
  }, {
    comment: 1
  })
  .then(data => {
    const { comment } = data
    return mongo.find("comment", {//_comment_
      query: [["limit", count]],
      _id: { $in: [...comment.map(c => mongo.dealId(c))] }
    }, {
      content: 1,
      user_info: 1,
    })
  })
  .then(data => {
    result = [...data]
    return mongo.find("user", {//_user_
      _id: { $in: data.map(d => mongo.dealId(d.user_info)) }
    }, {
      avatar:1
    })
  })
  .then(data => {
    console.log(result)
    result.forEach((r, i) => {
      let [avatar] = data.filter(d => d._id == r.user_info)
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
    return false
  })
  if(!data) {
    res = {
      success: false,
      res: null
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