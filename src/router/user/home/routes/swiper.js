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
        MovieModel.aggregate([
          {
            $sort: {
              createdAt: -1
            },
          },
          {
            $lookup: {
              from: 'images',
              localField: 'poster',
              foreignField: '_id',
              as: 'poster'
            },
          },
          {
            $unwind: "$poster"
          },
          {
            $limit: 3
          },
          {
            $project: {
              poster: "$poster.src",
              _id: 1
            }
          }
        ]),

        SpecialModel.aggregate([
          {
            $sort: {
              createdAt: -1
            },
          },
          {
            $lookup: {
              from: 'images',
              localField: 'poster',
              foreignField: '_id',
              as: 'poster'
            },
          },
          {
            $unwind: "$poster"
          },
          {
            $limit: 3
          },
          {
            $project: {
              poster: "$poster.src",
              _id: 1
            }
          }
        ]),
      ])
      .catch(err => {
        return false
      })
      const result = [ 
        ...(movieData || [] ).map(item => ({ ...item, type: "MOVIE" })), 
        ...(specialData || []).map(item => ({ type: "SPECIAL", ...item })) 
      ]
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
  
})

module.exports = router