const Router = require('@koa/router')
const { MongoDB, isType, withTry } = require('@src/utils')

const router = new Router()
const mongo = MongoDB()

router.get('/', async(ctx) => {
  const { _id } = ctx.query
  let res
  const [err, data] = await withTry(mongo.find)('_special_', {_id}, {movie: 1})
  if(err) {
    ctx.status = 404
    ctx.body = JSON.stringify({
      success: false,
      res: {
        data: {}
      }
    })
  }else {
    const [dataErr, dataList] = isType(data) ? await withTry(mongo.find)('_movie_', {
      $or: idList.map(id => ({_id: id}))
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