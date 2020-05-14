const Router = require('@koa/router')
const { MongoDB } = require('@src/utils')

const router = new Router()
const mongo = MongoDB()

router.get('/', async (ctx) => {
  const { _id, currPage, pageSize } = ctx.query
  let result
  let res
  const data = await mongo.findOne("_user_", {
    _id: mongo.dealId(_id),
    query: [ [ "limit", pageSize ], [ "skip", pageSize * currPage ] ]
  }, {
    comment: 1
  })
  .then(data => {
    const { comment } = data
    return mongo.find("_comment_", {
      _id: { $in: [...comment]}
    }, {
      source: 1,
      create_time: 1,
      hot: 1,
      content: 1,
    })
  })
  .then(data => {
    result = [...data]
    let comments = []
    data.forEach(d => {
      const { source: { type, comment } } = d
      if(type === 'user'){
        comments.push(comment)
      }
    })
    return mongo.find("_comment_", {
      _id: { $in: [ ...comments ] }
    }, {
      content: 1
    })
  })
  .then(data => {
    let newData = []
    result.forEach(re => {
      const { source: { type, comment } } = re
      if(type === 'user') {
        let newRe = {
          ...re,
          source: {
            type,
            comment: data.filter(d => d._id == comment)[0].content
          }
        }
        newData.push(newRe)
      }else if(type === 'movie') {
        newData.push(re)
      }
    })
    return newData
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

module.exports = router