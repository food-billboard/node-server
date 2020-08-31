const Router = require('@koa/router')
const { verifyTokenToData, UserModel, dealErr, notFound, Params, responseDataDeal } = require("@src/utils")

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
  const { mobile } = token

  const data = await UserModel.findOne({
    mobile: Number(mobile)
  })
  .select({
    glance: 1,
    updatedAt: 1
  })
  .populate({
    path: 'glance',
    select: {
      "info.classify": 1,
			"info.description": 1,
			"info.name": 1,
			poster: 1,
			publish_time: 1,
			hot: 1,
			// author_rate: 1,
			rate: 1,
    },
    options: {
      ...(pageSize >= 0 ? { limit: pageSize } : {}),
      ...((currPage >= 0 && pageSize >= 0) ? { skip: pageSize * currPage } : {})
    }
  })
  .exec()
  .then(data => !!data && data._doc)
  .then(notFound)
  .then(data => {
    const { glance, ...nextData } = data
    return {
      ...nextData,
      glance: glance.map(g => {
        const { _doc: { info: { description, name, classify }, poster, ...nextD } } = g
        return {
          ...nextD,
          poster: poster ? poster.src : null,
          description,
          name,
          classify,
          store:false
        }
      })
    }
  })
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data,
  })
})

module.exports = router