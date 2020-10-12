const Router = require('@koa/router')
const { MovieModel, SpecialModel, isEmpty, Params, responseDataDeal } = require('@src/utils')
const router = new Router()

const cache = {}
const handle = {
  get(target, prop) {
    return async function(count) {
      if(
        prop !== 'data' || 
        (
          prop === 'data' && 
          !isEmpty(target) && 
          (
            Reflect.has(target, 'expire') && 
            Reflect.has(target, 'max-age') && 
            Reflect.get(target, "expire") + Reflect.get(target, "max-age") >= Date.now()) &&
            Reflect.get(target, 'data').length === count
          )
        ) return Reflect.get(target, prop)
      //为空或过时
      const [ movieData, specialData ] = await Promise.all([
        MovieModel.find({})
        .sort({
          createdAt: -1
        })
        .select({
          poster: 1 
        })
        .limit(3)
        .exec()
        .then(data => !!data && data),

        SpecialModel.find()
        .sort({
          createdAt: -1
        })
        .select({
          poster: 1 
        })
        .limit(3)
        .exec()
        .then(data => !!data && data),
      ])
      .catch(err => {
        return false
      })
      const result = [ 
        ...(movieData ? movieData.map(m => {
          const { _doc: { poster, ...nextM } } = m
          return {
            ...nextM,
            type: "MOVIE",
            poster: poster? poster.src : null
          }
        }) : [] ), 
        ...(specialData ? specialData.map(s => {
          const { _doc: { poster, ...nextS } } = s
          return {
            ...nextS,
            type: "SPECIAL",
            poster: poster? poster.src : null
          }
        }) : []) ]
      Reflect.set(target, 'data', result)
      Reflect.set(target, 'expire', Date.now())
      Reflect.set(target, 'max-age', 1000 * 60 * 60 * 24)
      return Reflect.get(target, 'data')
    }
  }
}
let cacheProxy = new Proxy( cache, handle )

router.get('/', async(ctx) => {
  const [ count ] = Params.sanitizers(ctx.query, {
    name: 'count',
    _default: 6,
    type: ['toInt'],
    sanitizers: [
      data => data > 0 ? data : 6
    ]
  })
  let res = await cacheProxy.data(count)

  responseDataDeal({
    ctx,
    data: {
      data: res
    }
  })

  // ctx.body = JSON.stringify({
  //   success: true,
  //   res: {
  //     data: res
  //   }
  // })
})

module.exports = router