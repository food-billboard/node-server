const Router = require('@koa/router')
const List = require('./list')
const Detail = require('./detail')
const { MovieModel, dealErr, notFound } = require('@src/utils')
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

router
.get('/', async (ctx) => {
  const { _id, count=20 } = ctx.query
  let res
  const data = await MovieModel.findOne({
    _id: ObjectId(_id)
  })
  .select({
    comment: 1,
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
      comment: comment.map(c => {
        const { _doc: { user_info, ...nextC } } = c
        const { _doc: { avatar: { src }, ...nextInfo } } = user_info
        return {
          ...nextC,
          user_info: {
            ...nextInfo,
            avatar: src
          }
        }
      })
    }
  })
  .catch(dealErr(ctx))
  
  if(data & data.err) {
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
.use('/list', List.routes(), List.allowedMethods())
.use('/detail', Detail.routes(), Detail.allowedMethods())

module.exports = router