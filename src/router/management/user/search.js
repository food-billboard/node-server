const Router = require('@koa/router')
const { UserModel, dealErr, notFound, Params, responseDataDeal, ROLES_MAP, USER_STATUS } = require('@src/utils')

const router = new Router()

router
//搜索(筛选)-权限-日期-状态(登录)
.get('/', async(ctx) => {

  const check = Params.query(ctx, {
    name: 'role',
    validator: [
      data => typeof data === 'string' ? ROLES_MAP.includes(data.toUpperCase()) : typeof data == 'undefined'
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
      data => typeof data === 'string' ? USER_STATUS.includes(data.toUpperCase()) : typeof data === 'undefined'
    ]
  }, {
    name: 'content',
    validator: [
      data => typeof data === 'string' || typeof data === 'undefined'
    ]
  })

  if(check) return 

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
  const { query: { content, start_date, end_date, status, role } } = ctx

  const data = await UserModel.aggregate([

  ])
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data,
    needCachme: false
  })

})

module.exports = router