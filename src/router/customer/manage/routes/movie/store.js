const Router = require('@koa/router')
const {  verifyTokenToData, UserModel, dealErr, notFound, Params, responseDataDeal } = require("@src/utils")
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

router.get('/', async (ctx) => {
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

  const [, token] = verifyTokenToData(ctx)
  const { id } = token

  const data = await UserModel.findOne({
    _id: ObjectId(id)
  })
  .select({
    store: 1,
    updatedAt: 1
  })
  .populate({
    path: 'store._id',
    select: {
      "info.classify": 1,
			"info.description": 1,
			"info.name": 1,
			poster: 1,
			"info.screen_time": 1,
			hot: 1,
			// author_rate: 1,
      total_rate: 1,
      rate_person: 1
    },
    options: {
      ...(pageSize >= 0 ? { limit: pageSize } : {}),
      ...((currPage >= 0 && pageSize >= 0) ? { skip: pageSize * currPage } : {})
    },
    populate: {
      path: 'info.classify',
      select: {
        _id: 0,
        name: 1
      }
    }
  })
  .exec()
  .then(notFound)
  .then(data => {
    const { store } = data
    return {
      data: {
        ...data,
        store: store.map(s => {
          const { _id: { poster, info: { description, name, classify, screen_time }={}, total_rate, rate_person, ...nextS } } = s
          const rate = total_rate / rate_person
          return {
            ...nextS,
            poster: poster ? poster.src : null,
            description,
            name,
            classify,
            store: true,
            publish_time: screen_time,
            rate: Number.isNaN(rate) ? 0 : rate
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

module.exports = router