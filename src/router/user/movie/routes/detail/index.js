const Router = require('@koa/router')
const Comment = require('./routes/comment')
const Simple = require('./routes/simple')
const { MovieModel, dealErr, notFound, Params } = require("@src/utils")
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

router
.get('/', async (ctx) => {
  const check = Params.query(ctx, {
    name: "_id",
    type: ['isMongoId']
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
			function(data) {
				return ObjectId(data)
			}
		]
	})
  let res
  const data = await MovieModel.findOneAndUpdate({
    _id
  }, {
    $inc: { glance: 1 }
  })
  .select({
    updatedAt: 0,
    source_type: 0,
    stauts: 0,
    related_to: 0,
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
  .exec()
  .then(data => !!data && data._doc)
  .then(notFound)
  .then(data => {
    const { rest={}, ...nextData } = data
    let newDate = {  
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
      ...nextNewData
    } = newDate
    const {
      actor,
      director,
      district,
      classify,
      language,
      ...nextInfo
    } = info

    return {
      ...nextNewData,
      rate: total_rate/ rate_person,
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
      },
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

  })
  .catch(dealErr(ctx))

  if(data && data.err) {
    res = {
      ...data.res
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
.use('/comment', Comment.routes(), Comment.allowedMethods())
.use('/simple', Simple.routes(), Simple.allowedMethods())

module.exports = router