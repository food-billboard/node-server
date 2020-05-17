const Router = require('@koa/router')
const { MongoDB, isEmpty, withTry } = require('@src/utils')
const router = new Router()

const mongo = MongoDB()
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
      const [movieErr, movieData] = await withTry(mongo.find)('movie', {//_movie_
        query: [
          {
            __type__: 'sort',
            create_time: -1
          },
          ['limit', 3]
        ]
      }, { poster: 1 })
      const [specialErr, specialData] = await withTry(mongo.find)('special', {//_special_
        query: [
          {
            __type__: 'sort',
            create_time: -1
          },
          ['limit', 3]
        ]
      }, { poster: 1 })
      const result = [ ...(!movieErr ? movieData : [] ), ...(!specialErr ? specialData : []) ]
      Reflect.set(target, 'data', result)
      Reflect.set(target, 'expire', Date.now())
      Reflect.set(target, 'max-age', 1000 * 60 * 60 * 24)
      return Reflect.get(target, 'data')
    }
  }
}
let cacheProxy = new Proxy( cache, handle )

router.get('/', async(ctx) => {
  const { count=6 } = ctx.query
  let res = await cacheProxy.data(~~count)
  ctx.body = JSON.stringify({
    success: true,
    res: {
      data: res
    }
  })
})

module.exports = router