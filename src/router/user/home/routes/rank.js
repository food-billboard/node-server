const Router = require('@koa/router')
const { RankModel, MovieModel, dealErr, notFound, Params, responseDataDeal } = require('@src/utils')

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

  let result

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
  .limit(8)
  .exec()
  .then(data => !!data && data)
  .then(notFound)
  .then(data => {
    result = data

    return MovieModel.find({
      $or: [
        {
          "info.classify": { $in: [ ...result.filter(item => item.match_field && item.match_field.field === 'classify').map(item => item.match_field._id) ] }
        },
        {
          "info.district": { $in: [ ...result.filter(item => item.match_field && item.match_field.field === 'district').map(item => item.match_field._id) ] }
        }
      ]
    })
    .select({
      poster: 1, 
      name: 1,
      "info.classify": 1,
      "info.district": 1
    })
    .exec()
  })
  .then(data => !!data && data)
  .then(notFound)
  .then(data => {
    return {
      data: result.map(item => {

        const { _doc: { icon, match_field: { field, _id }, ...nextD } } = item
  
        const filter = data.filter(item => {
          const { info } = item
          return info[field].some(fd => fd.equals(_id))
        })
        .slice(0, count)
        .map(m => {
          const { _doc: { poster, info, ...nextM } } = m
            return {
              ...nextM,
              match_field: field,
              poster: poster ? poster.src : null,
            }
        })
  
        return {
          ...nextD,
          icon: icon ? icon.src : null,
          match: filter
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