const Router = require('@koa/router')
const Comment = require('./routes/comment')
const Rate = require('./routes/rate')
const Store = require('./routes/store')
const { verifyTokenToData, middlewareVerifyToken, UserModel, MovieModel, dealErr, notFound, Params, responseDataDeal } = require("@src/utils")
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

router
.use(async(ctx, next) => {
  const [, token] = verifyTokenToData(ctx)
  if(!token) {
    const data = dealErr(ctx)({ errMsg: 'not authorization', status: 401 })
    responseDataDeal({
      ctx,
      data,
      needCache: false
    })
    return 
  }
  return await next()
})
.get('/', async (ctx) => {
  const check = Params.query(ctx, {
    name: "_id",
    type: [ 'isMongoId' ]
  })
  if(check) return

  const [ _id ] = Params.sanitizers(ctx.query, {
    name: '_id',
    sanitizers: [
      data => ObjectId(data)
    ]
  })
  const [, token] = verifyTokenToData(ctx)
  const { id } = token

  let store = true

  const data = await UserModel.findOneAndUpdate({
    _id: ObjectId(id),
    // store: { $in: [_id] }
  }, {
    $pull: { glance: { _id } },
  })
  .select({
    _id: 1,
    store: 1
  })
  .exec()
  .then(data => !!data && data._doc)
  .then(notFound)
  .then(data => {
    if(!data.store.some(item => item._id.equals(_id))) store = false
    return MovieModel.findOneAndUpdate({
      _id
    }, { $inc: { glance: 1 } })
    .select({
      modified_time: 0,
      source_type: 0,
      stauts: 0,
      related_to: 0,
      barrage: 0
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
    const { info, poster, video, images, comment, total_rate, rate_person, same_film, tag, ...nextData } = data
    const { actor, director, district, language, classify, ...nextInfo } = info

    const rate = total_rate / rate_person

    UserModel.updateOne({
      _id: ObjectId(id),
    }, {
      $push: { glance: { _id, timestamps: Date.now() } }
    })

    return {
      data: {
        ...nextData,
        store,
        video: video ? video.src : null,
        rate: Number.isNaN(rate) ? 0 : parseFloat(rate).toFixed(1),
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
        tag: tag.map(item => ({ text: item.text})),
        info: {
          ...nextInfo,
          actor: actor.map(item => {
            const { _doc: { other: { avatar, ...nextOther }={}, ...nextItem } } = item
            return {
              ...nextItem,
              other: {
                ...nextOther,
                avatar: !!avatar ? avatar.src : null
              }
            }
          }),
          director,
          district,
          classify,
          language
        }
      }
    }
  })
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data
  })

})
.use(middlewareVerifyToken)
.use('/comment', Comment.routes(), Comment.allowedMethods())
.use('/rate', Rate.routes(), Rate.allowedMethods())
.use('/store', Store.routes(), Store.allowedMethods())

module.exports = router