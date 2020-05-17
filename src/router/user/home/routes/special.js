const Router = require('@koa/router')
const { MongoDB, isType, withTry } = require('@src/utils')

const router = new Router()
const mongo = MongoDB()

router.get('/', async(ctx) => {
  const { _id } = ctx.query
  let res
  const [err, data] = await withTry(mongo.findOne)('special', {_id: mongo.dealId(_id)}, {movie: 1})//_special_
  if(err) {
    ctx.status = 404
    ctx.body = JSON.stringify({
      success: false,
      res: {
        data: null
      }
    })
  }else {
    const [dataErr, dataList] = data ? await withTry(mongo.find)('movie', {//_movie_
      _id: { $in: [...data.movie.map(d => mongo.dealId(d))] }
    }, { name: 1, poster: 1, glance: 1 }) : [] 
    if(!dataErr) {
      if(isType(dataList, 'array')) {
        ctx.status = 200
        res = {
          success: true,
          res: {
            data: dataList
          }
        }
      }else {
        ctx.status = 404
        res = {
          success: false,
          res: {
            data: null
          }
        }
      }
      ctx.body = JSON.stringify(res)
    }
  }
})

module.exports = router