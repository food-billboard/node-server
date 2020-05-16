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
  let store = true
  const [, data] = await mongo.findOne("_user_", {
    mobile,
    store: { $in: [mongo.dealId(_id)] }
  }, {
    store: 1
  })
  .then(data => {
    if(!data) store = false
    return mongo.findOne("_movie_", {
      _id: mongo.dealiD(_ID)
    }, {
      modified_time: 0,
      source_type: 0,
      stauts: 0,
      related_to: 0
    })  
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
      mongo.find("_actor_", {
        _id: { $in: [...actor] }
      }, {
        name:1,
        other: 1
      }),
      mongo.find("_director_", {
        _id: { $in: [...director] }
      }, {
        name: 1
      }),
      mongo.find("_district_", {
        _id: { $in: [...district] }
      }, {
        name: 1
      }),
      mongo.find("_classify_", {
        _id: { $in: [...classify] }
      }, {
        name: 1
      }),
      mongo.find("_language_", {
        _id: { $in: [...language] }
      }, {
        name: 1
      }),
      mongo.find("_tag_", {
        _id: { $in: [...tag] }
      }, {
        text: 1
      }),
      mongo.find("_comment_", {
        _id: { $in: [...comment] },
        query: [
          {
            __type__: 'sort',
            create_time: -1
          },
          [ "limit", 30 ]
        ]
      }, {
        user_info: 1,
        "content.text":1
      }),
      mongo.findOne("_user_", {
        _id: author
      }, {
        username: 1
      }),
      mongo.find("_movie_", {
        _id: { $in: same_film.map(s => s.film) }
      }, {
        name: 1
      })
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
    return false
  })
  if(!data) {
    ctx.status = 500
    res = {
      scuccess: false,
      res: null
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