const Router = require('@koa/router')
const { MongoDB, verifyTokenToData } = require('@src/utils')

const router = new Router()
const mongo = MongoDB()

router.get('/', async (ctx) => {
  const [, token] = verifyTokenToData(ctx)
  const { mobile } = token
  const { currPage, pageSize } = ctx.query
  let result
  let res
  //查找评论id
  const data = await mongo.connect("user")
  .then(db => db.findOne({mobile}, {
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
        source: 1,
        create_time: 1,
        toal_like: 1,
        content: 1,
      },
      limit: pageSize,
      skip: currPage * pageSize
    }))
    .then(data => data.toArray())
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
    return mongo.connect("comment")
    .then(db => db.find({
      _id: { $in: [...comment] }
    }, {
      projection: {
        content: 1
      }
    }))
    .then(data => data.toArray())
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