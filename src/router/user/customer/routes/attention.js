const Router = require('@koa/router')
const { UserModel, dealErr, notFound, Params } = require("@src/utils")
const { Types: { ObjectId } } = require("mongoose")

const router = new Router()

router
.get('/', async (ctx) => {
  const check = Params.query(ctx, {
    name: '_id',
    type: ['isMongoId']
  })
  if(check) {
    ctx.body = JSON.stringify({
      ...check.res
    })
    return
  }

  const [ currPage, pageSize, _id ] = Params.sanitizers(ctx.query, {
    name: 'currPage',
    _default: 0,
    type: ['toInt'],
    sanitizers: [
      data => data >= 0 ? data : -1
    ]
  }, {
    name: 'pageSize',
    _default: 30,
    type: ['toInt'],
    sanitizers: [
      data => data >= 0 ? data : -1
    ]
  }, {
    name: '_id',
    sanitizers: [
      function(data) {
        return ObjectId(data)
      }
    ]
  })
  let res
  const data = await UserModel.findOne({
    _id
  })
  .select({
    attentions: 1,
    _id: 0,
  })
  .populate({
    path: 'attentions',
    options: {
      ...(pageSize >= 0 ? { limit: pageSize } : {}),
      ...((currPage >= 0 && pageSize >= 0) ? { skip: pageSize * currPage } : {})
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
        const { _doc: { avatar, ...nextA } } = a
        return {
          ...nextA,
          avatar: avatar ? avatar.src : null
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