const Router = require('@koa/router')
const { MovieModel, dealErr, notFound, Params, responseDataDeal, MOVIE_STATUS, MOVIE_SOURCE_TYPE } = require('@src/utils')
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

router
//搜索(筛选)-分类-日期-状态-来源分类(系统、用户)
.get('/', async(ctx) => {

  const check = Params.query(ctx, {
    name: 'classify',
    validator: [
      data => typeof data === 'string' ? ObjectId.isValid(data) : typeof data == 'undefined'
    ]
  }, {
    name: 'start_date',
    validator: [
      data => typeof data === 'string' ? (new Date(data)).toString() !== 'Invalid Date' : typeof data === 'undefined'
    ]
  }, {
    name: 'end_date',
    validator: [
      data => typeof data === 'string' ? (new Date(data)).toString() !== 'Invalid Date' : typeof data === 'undefined'
    ]
  }, {
    name: 'status',
    validator: [
      data => typeof data === 'string' ? MOVIE_STATUS.includes(data.toUpperCase()) : typeof data === 'undefined'
    ]
  }, {
    name: 'content',
    validator: [
      data => typeof data === 'string' || typeof data === 'undefined'
    ]
  }, {
    name: 'source_type',
    validator: [
      data => typeof data === 'string' ? MOVIE_SOURCE_TYPE.includes(data.toUpperCase()) : typeof data === 'undefined'
    ]
  })

  if(check) return 

  const [ currPage, pageSize, classify ] = Params.sanitizers(ctx.query, {
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
    name: 'classify',
    sanitizers: [
      data => ObjectId(data)
    ]
  })
  const { query: { content, start_date, end_date, status, source_type } } = ctx

  const data = await MovieModel.aggregate([

  ])
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data,
    needCachme: false
  })

})

module.exports = router