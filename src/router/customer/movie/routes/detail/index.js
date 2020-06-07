const Router = require('@koa/router')
const Comment = require('./routes/comment')
const Rate = require('./routes/rate')
const Store = require('./routes/store')
const { verifyTokenToData, middlewareVerifyToken, UserModel, MovieModel, dealErr } = require("@src/utils")
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

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
  let store = true

  const data = await UserModel.findOne({
    mobile: ~~mobile,
    store: { $in: [ObjectId(_id)] }
  })
  .select({
    _id: 1
  })
  .exec()
  .then(data => {
    if(!data) store = false
    return MovieModel.findOneAndUpdate({
      _id: ObjectId(_id)
    }, { $inc: { glance: 1 } })
    .select({
      modified_time: 0,
      source_type: 0,
      stauts: 0,
      related_to: 0
    })
    .populate({
      path: 'info.actor',
      select: {
        _id: 0,
        name: 1,
        "other.avatar": 1
      }
    })
    .populate({
      path: 'info.director',
      select: {
        name: 1,
        _id: 0
      }
    })
    .populate({
      path: 'info.district',
      select: {
        name: 1,
        _id: 0
      }
    })
    .populate({
      path: 'info.language',
      select: {
        name: 1,
        _id: 0
      }
    })
    .populate({
      path: 'tag',
      select: {
        text: 1,
        _id: 0
      }
    })
    .populate({
      path: 'comment',
      select: {
        user_info: 1,
        "content.text":1
      },
      options: {
        sort: {
          createdAt: -1,
        },
        limit: 30
      },
      populate: {
        path: 'user_info',
        select: {
          avatar: 1,
        }
      }
    })
    .populate({
      path: 'author',
      select: {
        username: 1,
        _id: 0
      }
    })
    .populate({
      path: 'same_film',
      select: {
        name: 1
      }
    })
    .exec()
  })
  .then(data => {
    const { info, rest, ...nextData } = data
    const { actor, director, district, language, classify, total_rate, rate_person, ...nextInfo } = info
    return {
      ...nextData,
      store,
      rate: total_rate / rate_person,
      info: {
        ...nextInfo,
        actor: {
          ...actor,
          ...(
            (rest.actor || []).map(r => ({
              name: r,
              other: {
                avatar: null
              }
            }))
          )
        },
        director: {
          ...director,
          ...(
            (rest.director || []).map(r => ({
              name: r
            }))
          )
        },
        district: {
          ...district,
          ...(
            (rest.district || []).map(r => ({
              name: r
            }))
          )
        },
        classify: {
          ...classify,
          ...(
            (rest.classify || []).map(r => ({
              name: r
            }))
          )
        },
        language: {
          ...language,
          ...(
            (rest.language || []).map(r => ({
              name: r
            }))
          )
        }
      }
    }
  })
  .catch(dealErr(ctx))

  // let result
  // let errMsg
  // const data = await mongo.connect("user")
  // .then(db => db.findOne({
  //   mobile: Number(mobile),
  //   store: { $in: [mongo.dealId(_id)] }
  // }, {
  //   projection: {
  //     store: 1
  //   }
  // }))
  // .then(data => {
  //   if(!data) store = false
  //   return mongo.connect("movie")
  //   .then(db => db.findOne({
  //     _id: mongo.dealId(_id)
  //   }, {
  //     projection: {
  //       modified_time: 0,
  //       source_type: 0,
  //       stauts: 0,
  //       related_to: 0
  //     }
  //   }))
  // })
  // .then(data => {
  //   const {
  //     rest={},
  //     ...nextData
  //   } = data
  //   result = {...nextData, store}
  //   const {
  //     info: {
  //       actor,
  //       director,
  //       district,
  //       classify,
  //       language
  //     },
  //     tag,
  //     comment,
  //     author,
  //     same_film
  //   } = result
  //   return Promise.all([
      // mongo.connect("actor")
      // .then(db => db.find({
      //   _id: { $in: [...actor] }
      // }, {
      //   projection: {
      //     _id: 0,
      //     name: 1,
      //     "other.avatar": 1
      //   }
      // }))
      // .then(data => data.toArray())
      // .then(data => [
      //   ...data,
      //   ...(
      //     (rest.actor || []).map(r => ({
      //       name: r,
      //       other: {
      //         avatar: null
      //       }
      //     }))
      //   )
      // ]),
      // mongo.connect("director")
      // .then(db => db.find({
      //   _id: { $in: [...director] }
      // }, {
      //   projection: {
      //     name: 1,
      //     _id: 0
      //   }
      // }))
      // .then(data => data.toArray())
      // .then(data => [
      //   ...data,
      //   ...(
      //     (rest.director || []).map(r => ({
      //       name: r
      //     }))
      //   )
      // ]),
      // mongo.connect("district")
      // .then(db => db.find({
      //   _id: { $in: [...district] }
      // }, {
      //   projection: {
      //     name: 1,
      //     _id: 0
      //   }
      // }))
      // .then(data => data.toArray())
      // .then(data => [
      //   ...data,
      //   ...(
      //     (rest.district || []).map(r => ({
      //       name: r
      //     }))
      //   )
      // ]),
      // mongo.connect("classify")
      // .then(db => db.find({
      //   _id: { $in: [...classify] }
      // }, {
      //   projection: {
      //     name: 1,
      //     _id: 0
      //   }
      // }))
      // .then(data => data.toArray())
      // .then(data => [
      //   ...data,
      //   ...(
      //     (rest.classify || []).map(r => ({
      //       name: r
      //     }))
      //   )
      // ]),
      // mongo.connect("language")
      // .then(db => db.find({
      //   _id: { $in: [...language] }
      // }, {
      //   projection: { 
      //     name: 1,
      //     _id: 0
      //   }
      // }))
      // .then(data => data.toArray())
      // .then(data => [
      //     ...data,
      //     ...(
      //       (rest.language || []).map(r => ({
      //         name: r
      //       }))
      //     )
      //   ]),
      // mongo.connect("tag")
      // .then(db => db.find({
      //   _id: { $in: [...tag] }
      // }, {
      //   projection: {
      //     text: 1,
      //     _id: 0
      //   }
      // }))
      // .then(data => data.toArray()),
      // mongo.connect("comment")
      // .then(db => db.find({
      //   _id: { $in: [...comment] },
      // }, {
      //   sort: {
      //     create_time: -1
      //   },
      //   limit: 30,
      //   projection: {
      //     user_info: 1,
      //     "content.text":1
      //   }
      // }))
      // .then(data => data.toArray())
      // .then(async (data) => {
      //   if(data && !data.length) return []
      //   let result = [...data]
      //   //获取头像
      //   const userData = await Promise.all(data.map(d => {
      //     const { user_info } = d
      //     return mongo.connect("user")
      //     .then(db => db.findOne({
      //       _id: user_info
      //     }, {
      //       projection: {
      //         avatar: 1,
      //       }
      //     }))
      //   }))
      //   userData.forEach((d, i) => {
      //     if(isType(d, 'object')) {
      //       const { _id, ...nextResult } = result[i]
      //       const { avatar } = d
      //       result[i] = {
      //         ...nextResult,
      //         user_info: {
      //           avatar
      //         }
      //       }
      //     }
      //   })
      //   return result
      // }),
      // mongo.connect("user")
      // .then(db => db.findOne({
      //   _id: author
      // }, {
      //   projection: {
      //     username: 1,
      //     _id: 0
      //   }
      // })),
    //   mongo.connect("movie")
    //   .then(db => db.find({
    //     _id: { $in: same_film.map(s => s.film) }
    //   }, {
    //     projection: {
    //       name: 1
    //     }
    //   }))
    //   .then(data => data.toArray())
    // ])
  // })
  // .then(data => {
  //   const [ actor, director, district, classify, language, tag, comment, author, same_film ] = data
  //   const { 
  //     info,
  //     total_rate,
  //     rate_person,
  //     same_film: originSameFilm,
  //     ...nextResult
  //   } = result
  //   result = {
  //     ...nextResult,
  //     info: {
  //       ...info,
  //       actor,
  //       district,
  //       director,
  //       classify,
  //       language
  //     },
  //     tag,
  //     rate: total_rate / rate_person,
  //     comment,
  //     author,
  //     same_film: originSameFilm.map(origin => {
  //       const { film, ...nextO } = origin
  //       const [name] = same_film.filter(s => {
  //         return mongo.equalId(s._id, film)
  //       })
  //       if(name) return {
  //         ...nextO,
  //         film,
  //         name: name.name
  //       }
  //     }).filter(f => !!f)
  //   }
  //   return result
  // })
  // .catch(err => {
  //   console.log(err)
  //   errMsg = err
  //   return false
  // })

  if(data && data.err) {
    res = {
      ...data.res
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