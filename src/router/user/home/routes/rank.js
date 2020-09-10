const Router = require('@koa/router')
const { RankModel, dealErr, notFound, Params, responseDataDeal } = require('@src/utils')

const router = new Router()

router.get('/', async(ctx) => {
  const [ count ] = Params.sanitizers(ctx.query, {
    name: 'count',
    _default: 3,
    type: ['toInt'],
    sanitizers: [
      data => data > 0 ? data : 0
    ]
  })

  const data = await RankModel.find({})
  .select({
    other: 0,
    createdAt: 0,
    updatedAt: 0,
    glance: 0,
  })
  .sort({
    glance: -1
  })
  .limit(12)
  .populate({
    path: 'match',
    select: {
      poster: 1, 
      name: 1
    },
    options: {
      limit: count
    }
  })
  .exec()
  .then(data => !!data && data)
  .then(notFound)
  .then(data => {
    return data.map(d => {
      const { _doc: { icon, match, ...nextD } } = d
      return {
        ...nextD,
        icon: icon ? icon.src : null,
        match: match.map(m => {
          const { _doc: { poster, ...nextM } } = m
          return {
            ...nextM,
            poster: poster ? poster.src : null,
          }
        })
      }
    })
  })
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data,
    needCache: false
  })

})

module.exports = router