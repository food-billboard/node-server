const Router = require('@koa/router')
const { pick, merge } = require('lodash')
const Comment = require('./routes/comment')
const Simple = require('./routes/simple')
const { MovieModel, dealErr, notFound, Params, responseDataDeal, avatarGet, MOVIE_STATUS } = require("@src/utils")
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
			function(data) {
				return ObjectId(data)
			}
		]
	})

  const data = await MovieModel.findOneAndUpdate({
    _id,
    status: MOVIE_STATUS.COMPLETE
  }, {
    $inc: { glance: 1 }
  })
  .select({
    name: 1,
    info: 1,
    video: 1,
    images: 1,
    poster: 1,
    tag: 1,
    comment: 1,
    author: 1,
    glance: 1,
    author_description: 1,
    author_rate: 1,
    hot: 1,
    rate_person: 1,
    total_rate: 1,
    same_film: 1,
    createdAt: 1,
    updatedAt: 1,
  })
  .populate({
    path: 'comment',
    select: {
      "content.text": 1,
      user_info: 1,
      _id: 0
    },
    options: {
      sort: {
        create_time: -1
      },
      limit: 20
    },
    populate: {
      path: 'user_info',
      select: {
        avatar: 1,
        username: 1,
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
      name: 1,
      _id: 0
    }
  })
  .populate({
    path: 'info.actor',
    select: {
      name: 1,
      "other.avatar": 1,
      _id: 0
    },
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
  .then(data => {
    let newData = {  
      ...data,
      store: false
    }
    const {
      info,
      images,
      comment,
      poster={},
      total_rate,
      rate_person,
      same_film,
      video,
      author,
      ...nextNewData
    } = newData
    const {
      actor,
      director,
      district,
      classify,
      language,
      ...nextInfo
    } = info

    const rate = total_rate / rate_person

    return {
      data: {
        ...nextNewData,
        author: {
          ...pick(author, ['username', '_id']),
          avatar: avatarGet(author.avatar)
        },
        rate: Number.isNaN(rate) ? 0 : parseFloat(rate).toFixed(1),
        info: {
          ...nextInfo,
          actor: actor.map(item => {
            const { avatar } = pick(item.other, ['avatar']) || {}
            return merge({}, pick(item, ['name', 'updatedAt']), {
              avatar: avatarGet(avatar)
            })
          }),
          director: director.map(item => pick(item, ['name'])),
          district: district.map(item => pick(item, ['name'])),
          classify: classify.map(item => pick(item, ['name'])),
          language: language.map(item => pick(item, ['name'])),
        },
        video: avatarGet(video, 'src'),
        comment: comment.map(c => {
          const { user_info, ...nextC } = c
          const { avatar, ...nextUserInfo } = user_info
          return {
            ...nextC,
            user_info: {
              ...nextUserInfo,
              avatar: avatarGet(avatar)
            }
          }
        }),
        images: images.map(i => i && i.src),
        poster: avatarGet(poster),
        same_film: same_film.map(s => {
          const { film, ...nextS } = s
          return {
            name: avatarGet(film, 'name'),
            ...nextS
          }
        })
      }
    }
  })
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data
  })

})
.use('/comment', Comment.routes(), Comment.allowedMethods())
.use('/simple', Simple.routes(), Simple.allowedMethods())

module.exports = router