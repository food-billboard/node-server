const Router = require('@koa/router')
const { MongoDB, isEmpty } = require('@src/utils')
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
      const [ movieData, specialData ] = await Promise.all([
        mongo.connect('movie')
        .then(db => db.find({}, {
          sort: {
            create_time: -1
          },
          limit: 3,
          projection: {
            poster: 1 
          }
        }))
        .then(data => data.toArray()),
        mongo.connect('special')
        .then(db => db.find({}, {
          sort: {
            create_time: -1
          },
          limit: 3,
          projection: {
            poster: 1 
          }
        }))
        .then(data => data.toArray())
      ])
      .catch(err => {
        console.log(err)
        return false
      })
      const result = [ ...(movieData ? movieData.map(m => ({ ...m, type: "MOVIE" })) : [] ), ...(specialData ? specialData.map(s => ({ ...s, type: "SPECIAL" })) : []) ]
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