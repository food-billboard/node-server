const Router = require('@koa/router')
const { RankModel, dealErr, avatarGet, Params, responseDataDeal, parseData } = require('@src/utils')

const router = new Router()

router
.get('/', async(ctx) => {
  const [ count ] = Params.sanitizers(ctx.query, {
    name: 'count',
    _default: 3,
    type: ['toInt'],
    sanitizers: [
      data => data > 0 ? data : 3
    ]
  })

  const data = await RankModel.find()
  .select({
    match: 1,
    icon: 1,
    updatedAt: 1,
    _id: 1,
    name: 1
  })
  .sort({
    glance: -1
  })
  .limit(8)
  .populate({
    path: 'icon',
    select: {
      src: 1
    }
  })
  .populate({
    path: 'match',
    select: {
      name: 1,
      _id: 1,
      poster: 1
    },
    options: {
      limit: count,
    },
    populate: [
      {
        path: 'poster',
        select: {
          src: 1
        }
      }
    ]
  })
  .exec()
  .then(parseData)
  .then(data => {
    return {
      data: data.map(item => {
        const { match, icon,...nextItem } = item 
        return {
          ...nextItem,
          icon: avatarGet(icon),
          match: match.map(item => {
            return {
              ...item,
              poster: avatarGet(item.poster)
            }
          })
        }
      })
    }
  })
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data,
    needCache: false
  })

})

module.exports = router