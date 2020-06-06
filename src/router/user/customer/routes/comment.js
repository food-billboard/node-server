const Router = require('@koa/router')
const { dealErr, UserModel } = require('@src/utils')
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

router.get('/', async (ctx) => {
  const { currPage=0, pageSize=30, _id } = ctx.query
  let res
  //查找评论id
  const data = await UserModel.findOne({
    _id: ObjectId(_id)
  })
  .select({
    comment: 1,
    _id: 0
  })
  .populate({
    path: 'comment',
    select: {
      source_type: 1,
      source_movie: 1,
      source_user: 1,
      createdAt: 1,
      total_like: 1,
      content: 1,
    },
    options: {
      limit: pageSize,
      skip: currPage * pageSize
    },
    populate: {
      path: 'source_movie',
      select: {
        name: 1
      }
    },
    populate: {
      path: 'source_user',
      select: {
        content: 1
      }
    }
  })
  .exec()
  .then(data => data)
  .catch(dealErr(ctx))

  if(data && !data.err) {
    res = {
      success: true,
      res: {
        data
      }
    }
  }else {
    res = {
      ...data.res
    }
  }

  ctx.body = JSON.stringify(res)

})

module.exports = router