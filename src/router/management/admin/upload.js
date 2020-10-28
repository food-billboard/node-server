const Router = require('@koa/router')
const { UserModel, notFound, dealErr, responseDataDeal, verifyTokenToData, Params } = require('@src/utils')

const router = new Router()

router
//上传列表
.get('/', async(ctx) => {

  const [, token] = verifyTokenToData(ctx)
  const { mobile } = token

  const [ currPage, pageSize ] = Params.sanitizers(ctx.query, {
    name: 'currPage',
    type: ['toInt'],
    _default: 0,
    sanitizers: [
      data => data >= 0 ? data : -1
    ]
  }, {
    name: 'pageSize',
    type: ['toInt'],
    _default: 30,
    sanitizers: [
      data => data >= 0 ? data : -1
    ]
  })

  const data = await UserModel.findOne({
    mobile: Number(mobile)
  })
  .select({
    _id: 0,
    issue: 1
  })
  .populate({
    path: 'issue._id',
    select: {
			poster: 1,
			hot: 1,
      author_rate: 1,
      author_description: 1,
      total_rate: 1,
      rate_person: 1,
      createdAt: 1,
      updatedAt: 1,
      barrage: 1,
      tag: 1,
      comment: 1,
      glance: 1,
      stauts: 1,
      name: 1
    },
    options: {
      ...((pageSize >= 0 && currPage >= 0) ? { skip: pageSize * currPage, } : {}),
      ...(pageSize >= 0 ? { limit: pageSize, } : {})
    }
  })
  .exec()
  .then(data => !!data && data._doc)
  .then(notFound)
  .then(data => {
    const { issue } = data
    return {
      data: {
        ...data,
        issue: issue.map(s => {
          const { _doc: { _id: { _doc: { poster, total_rate, rate_person, comment, barrage, glance, ...nextS } } } } = s
          const rate = total_rate / rate_person
          return {
            ...nextS,
            comment: comment.length,
            barrage: barrage.length,
            glance: glance.length,
            total_rate,
            rate_person,
            poster: poster ? poster.src : null,
            description,
            name,
            rate: Number.isNaN(rate) ? 0 : parseFloat(rate).toFixed(1)
          }
        })
      }
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

/**
 *  {
   data: {
     issue: [
       {
        poster,
        hot,
        author_rate,
        author_description,
        total_rate,
        rate_person,
        rate,
        createdAt,
        updatedAt,
        tag,
        comment: number,
        glance: number,
        stauts,
        name,
        barrage: number
       }
     ]
   }
 }
 */