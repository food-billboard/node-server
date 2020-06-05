const Router = require('@koa/router')
const { MongoDB, isType } = require('@src/utils')

const router = new Router()
const mongo = MongoDB()

router.get('/', async (ctx) => {
  const { currPage=0, pageSize=30, _id } = ctx.query
  let result
  let res
  //查找评论id
  const data = await mongo.connect("user")
  .then(db => db.findOne({_id: mongo.dealId(_id)}, {
    projection: {
      comment: 1
    }
  }))
  .then(data => {
    const { comment } = data
    if(comment && !comment.length) return Promise.reject({err: null, data: []})
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
    let movies = []
    let users = []
    data.forEach(d => {
      const { source: { type, comment } } = d
      if(type === 'USER'){
        users.push(comment)
      }
      if(type === 'MOVIE') {
        movies.push(comment)
      }
    })
    return Promise.all([
      mongo.connect("comment")
      .then(db => db.find({
        _id: { $in: [...comments] }
      }, {
        projection: {
          content: 1
        }
      }))
      .then(data => data.toArray()),
      mongo.connect("movie")
      .then(db => db.find({
        _id: { $in: [ ...movies ] }
      }, {
        projection : {
          name: 1
        }
      }))
      .then(data => data.toArray())
    ])
  })
  .then(([users, movies]) => {
    let newData = []
    result.forEach(re => {
      const { source: { type, comment } } = re
      if(type === 'USER') {
        let newRe = {
          ...re,
          source: {
            type,
            comment,
            content: users.filter(d => mongo.equalId(d._id, comment))[0].content
          }
        }
        newData.push(newRe)
      }else if(type === 'Movie') {
        newData.push({
          ...re,
          source: {
            type,
            comment,
            content: movies.filter(d => mongo.equalId(d._id, comment))[0].name
          },
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