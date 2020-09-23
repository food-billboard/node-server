const Router = require('@koa/router')
const Comment = require('./routes/comment')
const Simple = require('./routes/simple')
const { MovieModel, dealErr, notFound, Params, responseDataDeal } = require("@src/utils")
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

router
.get('/', async (ctx) => {
  const check = Params.query(ctx, {
    name: "_id",
    type: ['isMongoId']
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
    _id
  }, {
    $inc: { glance: 1 }
  })
  .select({
    source_type: 0,
    stauts: 0,
    related_to: 0,
    barrage: 0,
    __v: 0
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
        avatar: 1
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
  .then(data => {
    const { ...nextData } = data
    let newData = {  
      ...nextData,
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
      video: { _doc: { updatedAt, ...nextVideo } }={},
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
        rate: Number.isNaN(rate) ? 0 : parseFloat(rate).toFixed(1),
        info: {
          ...nextInfo,
          actor,
          director,
          district,
          classify,
          language
        },
        video: nextVideo,
        comment: comment.map(c => {
          const { _doc: { user_info, ...nextC } } = c
          const { _doc: { avatar, ...nextUserInfo } } = user_info
          return {
            ...nextC,
            user_info: {
              ...nextUserInfo,
              avatar: avatar ? avatar.src : null
            }
          }
        }),
        images: images.map(i => i && i.src),
        poster: poster ? poster.src : null,
        same_film: same_film.map(s => {
          const { _doc: { film, ...nextS } } = s
          return {
            name: film ? film.name : null,
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