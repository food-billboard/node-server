const Router = require('@koa/router')
const { verifyTokenToData, UserModel, dealErr, notFound, Params, responseDataDeal } = require("@src/utils")
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

router
.get('/', async (ctx) => {
  const [, token] = verifyTokenToData(ctx)
  const { id } = token
  const [ currPage, pageSize ] = Params.sanitizers(ctx.query, {
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
  })

  const data = await UserModel.findOne({
    _id: ObjectId(id)
  })
  .select({
    fans: 1,
    updatedAt: 1
  })
  .populate({
    path: 'fans._id',
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
    const { fans, _id, ...nextData } = data
    return {
      data: {
        ...nextData,
        fans: fans.map(f => {
          const { _doc: { _id: { _doc: { avatar, ...nextF } } } } = f
          return {
            avatar: avatar ? avatar.src : null,
            ...nextF
          }
        })
      }
    }
  })
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data,
  })

})

module.exports = router