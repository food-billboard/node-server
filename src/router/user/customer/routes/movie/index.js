const Router = require('@koa/router')
const Browse = require('./browser')
const Store = require('./store')
const { UserModel, dealErr, notFound, Params } = require("@src/utils")
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

router
.get('/', async (ctx) => {
  const check = Params.query(ctx, {
    name: '_id',
    type: ['isMongoId']
  })
  if(check) {
    ctx.body = JSON.stringify({
      ...check.res
    })
    return
  }

  const [ currPage, pageSize, _id ] = Params.sanitizers(ctx.query, {
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
  }, {
    name: '_id',
    sanitizers: [
      function(data) {
        return ObjectId(data)
      }
    ]
  })
  const data = await UserModel.findOne({
    _id
  })
  .select({
    issue: 1,
    _id: 0
  })
  .populate({
    path: 'issue',
    select: {
      name: 1,
      poster: 1,
      hot: 1,
      author_rate: 1,
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
    const { issue } = data
    return {
      issue: issue.map(i => {
        const { _doc: { poster, ...nextI } } = i
        console.log(i)
        return {
          ...nextI,
          poster: poster ? poster.src : null
        }
      })
    }
  })
  .catch(dealErr(ctx))

  if(data && data.err) {
    res = {
      ...data.res
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
.use('/browser', Browse.routes(), Browse.allowedMethods())
.use('/store', Store.routes(), Store.allowedMethods())

module.exports = router