const Router = require('@koa/router')
const Comment = require('./routes/comment')
const Rate = require('./routes/rate')
const Store = require('./routes/store')
const Special = require('./routes/special')
const Classify = require('./routes/classify')
const Rank = require('./routes/rank')
const { verifyTokenToData, UserModel, MovieModel, dealErr, notFound, Params, responseDataDeal, avatarGet, MOVIE_STATUS } = require("@src/utils")
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

router
.get('/', async (ctx) => {
  const check = Params.query(ctx, {
    name: "_id",
    validator: [
			data => ObjectId.isValid(data)
		]
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

  let pushData = { timestamps: Date.now() }
  pushData = { ...pushData, _id}

  const data = await UserModel.findOneAndUpdate({
    _id: ObjectId(id),
    // status: MOVIE_STATUS.COMPLETE
  }, {
    $pull: {
      "glance": { _id }
    },
    $inc: {
      glance_count: 1
    }
  })
  .select({
    _id: 1,
    store: 1
  })
  .exec()
  .then(notFound)
  .then(data => {
    if(!data.store.some(item => item._id.equals(_id))) store = false
    return MovieModel.findOneAndUpdate({
      _id
    }, { $inc: { glance: 1 } })
    .select({
      modified_time: 0,
      source_type: 0,
      status: 0,
      related_to: 0,
      barrage: 0
    })
    .populate({
      path: 'comment',
      select: {
        user_info: 1,
        "content.text":1,
        _id: 1
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
          username: 1,
          _id: 1
        }
      }
    })
    .populate({
      path: 'author',
      select: {
        username: 1,
        _id: 1,
        avatar: 1
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
    .then(notFound)
  })
  .then(data => {
    const { author, info, poster, video, images, comment, total_rate, rate_person, same_film, tag, author_rate, ...nextData } = data
    const { actor, director, district, language, classify, ...nextInfo } = info

    const rate = (total_rate + author_rate ) / rate_person

    return {
      data: {
        ...nextData,
        author_rate,
        author: {
          _id: author._id,
          username: author.username,
          avatar: avatarGet(author.avatar)
        },
        store,
        video: video ? video.src : null,
        rate: Number.isNaN(rate) ? 0 : parseFloat(rate).toFixed(1),
        rate_person,
        poster: poster ? poster.src : null,
        images: images.filter(i => i && !!i.src).map(i => i.src),
        comment: comment.map(com => {
          const { user_info, content: { text }, ...nextC } = com
          const { avatar, ...nextUserInfo } = user_info
          return {
            ...nextC,
            content: {
              text: text || null
            },
            user_info: {
              ...nextUserInfo,
              avatar: avatarGet(avatar)
            }
          }
        }),
        same_film: same_film.map(same => {
          const { film: { name, _id }, ...nextS } = same
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
            const { other: { avatar }={}, ...nextItem } = item
            return {
              ...nextItem,
              avatar: avatarGet(avatar)
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

  try {
    await UserModel.updateOne({
      _id: ObjectId(id)
    }, {
      $push: {
        "glance": pushData
      }
    })
  }catch(err) {}

})
.use('/comment', Comment.routes(), Comment.allowedMethods())
.use('/rate', Rate.routes(), Rate.allowedMethods())
.use('/store', Store.routes(), Store.allowedMethods())
.use('/special', Special.routes(), Special.allowedMethods())
.use('/classify', Classify.routes(), Classify.allowedMethods())
.use('/rank', Rank.routes(), Rank.allowedMethods())

module.exports = router