const Router = require('@koa/router')
const Comment = require('./routes/comment')
const Rate = require('./routes/rate')
const Store = require('./routes/store')
const { MongoDB, verifyTokenToData, middlewareVerifyToken } = require("@src/utils")

const router = new Router()
const mongo = MongoDB()

// params: { id: 电影id }

router
.get('/', async (ctx) => {
  const { _id } = ctx.query
  const [, token] = verifyTokenToData(ctx)
  if(!token) return ctx.redirect("/api/user/movie/detail")
  const { mobile } = token
  let res
  let result
  let errMsg
  let store = true
  const data = await mongo.connect("user")
  .then(db => db.findOne({
    mobile,
    store: { $in: [mongo.dealId(_id)] }
  }, {
    projection: {
      store: 1
    }
  }))
  .then(data => {
    if(!data) store = false
    return mongo.connect("movie")
    .then(db => db.findOne({
      _id: mongo.dealId(_id)
    }, {
      projection: {
        modified_time: 0,
        source_type: 0,
        stauts: 0,
        related_to: 0
      }
    }))
  })
  .then(data => {
    result = {...data, store}
    const {
      info: {
        actor,
        director,
        district,
        classify,
        language
      },
      tag,
      comment,
      author,
      same_film
    } = result
    return Promise.all([
      mongo.connect("actor")
      .then(db => db.find({
        _id: { $in: [...actor] }
      }, {
        projection: {
          name: 1,
          other: 1
        }
      }))
      .then(data => data.toArray()),
      mongo.connect("director")
      .then(db => db.find({
        _id: { $in: [...director] }
      }, {
        projection: {
          name: 1
        }
      }))
      .then(data => data.toArray()),
      mongo.connect("district")
      .then(db => db.find({
        _id: { $in: [...district] }
      }, {
        projection: {
          name: 1
        }
      })),
      mongo.connect("classify")
      .then(db => db.find({
        _id: { $in: [...classify] }
      }, {
        projection: {
          name: 1
        }
      }))
      .then(data => data.toArray()),
      mongo.connect("language")
      .then(db => db.find({
        _id: { $in: [...language] }
      }, {
        projection: { 
          name: 1
        }
      }))
      .then(data => data.toArray()),
      mongo.connect("tag")
      .then(db => db.find({
        _id: { $in: [...tag] }
      }, {
        projection: {
          text: 1
        }
      }))
      .then(data => data.toArray()),
      mongo.connect("comment")
      .then(db => db.find({
        _id: { $in: [...comment] },
      }, {
        sort: {
          create_time: -1
        },
        limit: 30,
        projection: {
          user_info: 1,
          "content.text":1
        }
      }))
      .then(data => data.toArray()),
      mongo.connect("user")
      .then(db => db.findOne({
        _id: author
      }, {
        projection: {
          username: 1
        }
      })),
      mongo.connect("movie")
      .then(db => db.find({
        _id: { $in: same_film.map(s => s.film) }
      }, {
        projection: {
          name: 1
        }
      }))
      .then(data => data.toArray())
    ])
  })
  .then(data => {
    const [ actor, director, district, classify, language, tag, comment, author, same_film ] = data
    const { 
      info,
      same_film: _same_film,
      total_rate,
      rate_person
    } = result
    result = {
      ...result,
      info: {
        ...info,
        actor,
        district,
        director,
        classify,
        language
      },
      tag,
      rate: total_rate / rate_person,
      comment,
      author,
      same_film: _same_film.map(film => {
        const { film: _id } = film
        const [target] = same_film.filter(s => s._id == _id)
        if(target) {
          return {
            ...film,
            name: target.name,
          }
        }else {
          return film
        }
      })
    }
    return result
  })
  .catch(err => {
    console.log(err)
    errMsg = err
    return false
  })
  if(errMsg) {
    ctx.status = 500
    res = {
      scuccess: false,
      res: {
        errMsg
      }
    }
  }else {
    res = {
      scuccess: true,
      res: {
        data
      }
    }
  }

  ctx.body = JSON.stringify(res)
})
.use(middlewareVerifyToken)
.use('/comment', Comment.routes(), Comment.allowedMethods())
.use('/rate', Rate.routes(), Rate.allowedMethods())
.use('/store', Store.routes(), Store.allowedMethods())

module.exports = router