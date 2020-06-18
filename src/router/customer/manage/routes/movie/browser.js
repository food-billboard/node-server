const Router = require('@koa/router')
const { verifyTokenToData, UserModel, dealErr, notFound, Params } = require("@src/utils")

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
  let res 

  const data = await UserModel.findOne({
    mobile: Number(mobile)
  })
  .select({
    glance: 1
  })
  .populate({
    path: 'glance',
    select: {
      "info.description": 1,
      "info.name": 1,
      poster: 1
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
    const { glance } = data
    return glance.map(g => {
      const { _doc: { info: { description, name }, poster: { src }, ...nextD } } = g
      return {
        ...nextD,
        poster: src,
        description,
        name,
      }
    })
  })
  .catch(dealErr(ctx))

  if(data && data.err) {
    res = {
      ...data.ers
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