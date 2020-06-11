const Router = require('@koa/router')
const { UserModel, dealErr, notFound } = require("@src/utils")
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

router
.get('/', async (ctx) => {
  const { currPage=0, pageSize=30, _id } = ctx.query
  let res
  const data = await UserModel.findOne({
    _id: ObjectId(_id)
  })
  .select({
    fans: 1,
    _id: 0
  })
  .populate({
    path: 'fans',
    select: {
      username: 1,
      avatar: 1
    },
    options: { 
      limit: pageSize, 
      skip: pageSize * currPage 
    },
    populate: {
      path: 'avatar',
      select: {
        src: 1
      }
    }
  })
  .exec()
  .then(data => !!data && data._doc)
  .then(notFound)
  .then(data => {
    const { fans } = data
    return {
      fans: fans.map(d => {
        const { _doc: { avatar: { src }, ...nextD } } = d
        return {
          ...nextD,
          avatar: src,
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

module.exports = router