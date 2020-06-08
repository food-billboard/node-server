const Router = require('@koa/router')
const { UserModel, dealErr, paramsCheck, notFound } = require("@src/utils")
const { Types: { ObjectId } } = require("mongoose")

const router = new Router()

router
.use(paramsCheck.get(['_id']))
.get('/', async (ctx) => {
  const { currPage=0, pageSize=30, _id } = ctx.query
  let res
  const data = await UserModel.findOne({
    _id: ObjectId(_id)
  })
  .select({
    attentions: 1,
    _id: 0,
  })
  .populate({
    path: 'attentions',
    options: {
      limit: pageSize,
      skip: pageSize * currPage
    },
    select: {
      username: 1,
      avatar: 1
    }
  })
  .exec()
  .then(data => !!data && data._doc)
  .then(notFound)
  .then(data => {
    const { attentions } = data
    return {
      attentions: attentions.map(a => {
        const { _doc: { avatar: { src }, ...nextA } } = a
        return {
          ...nextA,
          avatar: src
        }
      })
    }
  })
  .catch(dealErr(ctx))

  if(data && data.err) {
    res = {
      ...data.err
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