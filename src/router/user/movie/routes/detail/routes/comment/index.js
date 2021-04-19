const Router = require('@koa/router')
const List = require('./list')
const Detail = require('./detail')
const { MovieModel, dealErr, notFound, Params, responseDataDeal } = require('@src/utils')
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

  const [ _id, count ] = Params.sanitizers(ctx.query, {
    name: '_id',
    sanitizers: [
      data => ObjectId(data)
    ]
  }, {
    name: 'count',
    _default: 20,
    type: ['toInt']
  })

  const data = await MovieModel.findOne({
    _id
  })
  .select({
    comment: 1,
    updatedAt: 1,
    _id: 0
  })
  .populate({
    path: 'comment',
    select: {
      "content.text": 1,
      user_info: 1,
      _id: 0
    },
    options: {
      limit: count
    },
    populate: {
      path: 'user_info',
      select: {
        avatar: 1,
        _id: 0
      }
    }
  })
  .then(data => !!data && data._doc)
  .then(notFound)
  .then(data => {
    const { comment } = data
    return {
      data: {
        ...data,
        comment: comment.map(c => {
          const { _doc: { user_info, ...nextC } } = c
          const { _doc: { avatar, roles, ...nextInfo } } = user_info
          return {
            ...nextC,
            user_info: {
              ...nextInfo,
              avatar: avatar ? avatar.src : null
            }
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
.use('/list', List.routes(), List.allowedMethods())
.use('/detail', Detail.routes(), Detail.allowedMethods())

module.exports = router