const Router = require('@koa/router')
const Comment = require('./routes/comment')
const Rate = require('./routes/rate')
const Store = require('./routes/store')
const { verifyTokenToData, middlewareVerifyToken, UserModel, MovieModel, dealErr, notFound, Params } = require("@src/utils")
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

router
.get('/', async (ctx) => {
  const check = Params.query(ctx, {
    name: "_id",
    type: [ 'isMongoId' ]
  })
  if(check) {
    ctx.body = JSON.stringify({
      ...check.res
    })
    return
  }

  const [ _id ] = Params.sanitizers(ctx.query, {
    name: '_id',
    sanitizers: [
      data => ObjectId(data)
    ]
  })
  const [, token] = verifyTokenToData(ctx)
  if(!token) {
    ctx.status = 401
    return ctx.redirect("/api/user/movie/detail")
  }
  const { mobile } = token
  let res
  let store = true

  const data = await UserModel.findOne({
    mobile: Number(mobile),
    store: { $in: [_id] }
  })
  .select({
    _id: 1
  })
  .exec()
  .then(data => !!data && data._doc)
  .then(data => {
    if(!data) store = false
    return MovieModel.findOneAndUpdate({
      _id
    }, { $inc: { glance: 1 } })
    .select({
      modified_time: 0,
      source_type: 0,
      stauts: 0,
      related_to: 0
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
      path: 'same_film.film',
      select: {
        name: 1
      }
    })
    .populate({
      path: 'info.actor',
      select: {
        name: 1,
        "other.avatar": 1,
        _id: 0
      }
    })
    .pupulate({
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
      path: 'info.classify',
      select: {
        name: 1,
        _id: 0
      }
    })
    .populate({
      path: 'info.language',
      select: {
        _id: 0,
        name: 1
      }
    })
    .exec()
    .then(data => !!data && data._doc)
    .then(notFound)
  })
  .then(data => {
    const { info, rest, poster, video, images, comment, total_rate, rate_person, same_film, ...nextData } = data
    const { actor, director, district, language, classify, ...nextInfo } = info
    return {
      ...nextData,
      store,
      video: video ? src : null,
      rate: total_rate / rate_person,
      poster: poster ? poster.src : null,
      images: images.filter(i => i && !!i.src).map(i => i.src),
      comment: comment.map(com => {
        const { _doc: { user_info, content: { text }, ...nextC } } = com
        const { _doc: { avatar, ...nextUserInfo } } = user_info
        return {
          ...nextC,
          content: {
            text: text || null
          },
          user_info: {
            ...nextUserInfo,
            avatar: avatar ? avatar.src : null
          }
        }
      }),
      same_film: same_film.map(same => {
        const { _doc: { film: { name, _id }, ...nextS } } = same
        return {
          name,
          _id,
          ...nextS
        }
      }),
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