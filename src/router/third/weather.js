const Router = require('@koa/router')
const axios = require('axios')
const { dealErr, Params, responseDataDeal, getAuthToken } = require('@src/utils')

const router = new Router()

// 天气查询
router
.post('/', async (ctx) => {

  const check = Params.body(ctx, {
    name: 'city',
    validator: [
      data => !!data 
    ]
  })

  if(check) {
    return 
  }

  const { city } = ctx.request.body

  const data = await getAuthToken('weather')
  .then(code => {
    return axios.get(`http://apis.juhe.cn/simpleWeather/query?city=${encodeURIComponent(city)}&key=${code}`)
  })
  .then(data => {
    const {
      error_code,
      result,
      reason 
    } = data.data
    if(error_code != 0) return Promise.reject({ errMsg: reason, status: 400 }) 
    return {
      data: result   
    }
  })
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data
  })

})

module.exports = router