const Router = require('@koa/router')
const { MongoDB, verifyTokenToData, isType } = require('@src/utils')

const router = new Router()
const mongo = MongoDB()

router.get('/', async (ctx) => {
  const [, token] = verifyTokenToData(ctx)
  const { mobile } = token
  const { currPage=0, pageSize=30, _id } = ctx.query
  let result
  let res
  let customerId
  //查找评论id
  const data = await mongo.connect("user")
  .then(db => db.findOne({
    $or: [ { mobile: Number(mobile) }, { _id: mongo.dealId(_id) } ]
  }, {
    projection: {
      comment: 1
    }
  }))
  .then(data => {
    if(data && data.length != 2) return Promise.reject({err: null, data: []})
    let comments
    data.forEach(d => {
      const { comment, _id:id } = d
      if(id.toString() == _id) {
        comments = [...comment]
      }else {
        customerId = id
      }
    })
    return mongo.connect("comment")
    .then(db => db.find({
      _id: { $in: [...comments] }
    }, {
      projection: {
        source: 1,
        create_time: 1,
        toal_like: 1,
        content: 1,
        like_person: 1
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
      _id: { $in: [...comments] }
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
      const { source: { type, comment }, like_person, ...nextRe } = re
      let like = false
      if(like_person.some(l => l.toString() == customerId.toString())) {
        like = true
      }
      if(type === 'user') {
        let newRe = {
          ...nextRe,
          source: {
            type,
            comment: data.filter(d => d._id == comment)[0].content
          },
          like
        }
        newData.push(newRe)
      }else if(type === 'movie') {
        newData.push({
          ...nextRe,
          like
        })
      }

    })
    return newData
  })
  .catch(err => {
    if(isType(err, "object") && err.data) return err.data
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