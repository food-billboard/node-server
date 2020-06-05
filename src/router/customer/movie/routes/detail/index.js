const Router = require('@koa/router')
const Comment = require('./routes/comment')
const Rate = require('./routes/rate')
const Store = require('./routes/store')
const { MongoDB, verifyTokenToData, middlewareVerifyToken, isType } = require("@src/utils")

const router = new Router()
const mongo = MongoDB()

router
.get('/', async (ctx) => {
  const { _id } = ctx.query
  const [, token] = verifyTokenToData(ctx)
  if(!token) {
    ctx.status = 401
    return ctx.redirect("/api/user/movie/detail")
  }
  const { mobile } = token
  let res
  let result
  let errMsg
  let store = true
  const data = await mongo.connect("user")
  .then(db => db.findOne({
    mobile: Number(mobile),
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
    const {
      rest={},
      ...nextData
    } = data
    result = {...nextData, store}
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
          _id: 0,
          name: 1,
          "other.avatar": 1
        }
      }))
      .then(data => data.toArray())
      .then(data => [
        ...data,
        ...(
          (rest.actor || []).map(r => ({
            name: r,
            other: {
              avatar: null
            }
          }))
        )
      ]),
      mongo.connect("director")
      .then(db => db.find({
        _id: { $in: [...director] }
      }, {
        projection: {
          name: 1,
          _id: 0
        }
      }))
      .then(data => data.toArray())
      .then(data => [
        ...data,
        ...(
          (rest.director || []).map(r => ({
            name: r
          }))
        )
      ]),
      mongo.connect("district")
      .then(db => db.find({
        _id: { $in: [...district] }
      }, {
        projection: {
          name: 1,
          _id: 0
        }
      }))
      .then(data => data.toArray())
      .then(data => [
        ...data,
        ...(
          (rest.district || []).map(r => ({
            name: r
          }))
        )
      ]),
      mongo.connect("classify")
      .then(db => db.find({
        _id: { $in: [...classify] }
      }, {
        projection: {
          name: 1,
          _id: 0
        }
      }))
      .then(data => data.toArray())
      .then(data => [
        ...data,
        ...(
          (rest.classify || []).map(r => ({
            name: r
          }))
        )
      ]),
      mongo.connect("language")
      .then(db => db.find({
        _id: { $in: [...language] }
      }, {
        projection: { 
          name: 1,
          _id: 0
        }
      }))
      .then(data => data.toArray())
      .then(data => [
          ...data,
          ...(
            (rest.language || []).map(r => ({
              name: r
            }))
          )
        ]),
      mongo.connect("tag")
      .then(db => db.find({
        _id: { $in: [...tag] }
      }, {
        projection: {
          text: 1,
          _id: 0
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
      .then(data => data.toArray())
      .then(async (data) => {
        if(data && !data.length) return []
        let result = [...data]
        //获取头像
        const userData = await Promise.all(data.map(d => {
          const { user_info } = d
          return mongo.connect("user")
          .then(db => db.findOne({
            _id: user_info
          }, {
            projection: {
              avatar: 1,
            }
          }))
        }))
        userData.forEach((d, i) => {
          if(isType(d, 'object')) {
            const { _id, ...nextResult } = result[i]
            const { avatar } = d
            result[i] = {
              ...nextResult,
              user_info: {
                avatar
              }
            }
          }
        })
        return result
      }),
      mongo.connect("user")
      .then(db => db.findOne({
        _id: author
      }, {
        projection: {
          username: 1,
          _id: 0
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
      total_rate,
      rate_person,
      same_film: originSameFilm,
      ...nextResult
    } = result
    result = {
      ...nextResult,
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
      same_film: originSameFilm.map(origin => {
        const { film, ...nextO } = origin
        const [name] = same_film.filter(s => {
          return mongo.equalId(s._id, film)
        })
        if(name) return {
          ...nextO,
          film,
          name: name.name
        }
      }).filter(f => !!f)
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