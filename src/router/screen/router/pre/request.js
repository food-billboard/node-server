const Router = require('@koa/router')
const axios = require('axios')
const { dealErr, Params, responseDataDeal } = require('@src/utils')

const router = new Router()

router
.post('/', async (ctx) => {

  const check = Params.body(ctx, {
    name: 'url',
    validator: [
      data => typeof data === 'string' && !!data.length && !data.includes('/api/screen/pre/request')
    ]
  }, {
    name: 'body',
    validator: [
      data => {
        return (typeof data === 'string') && !!data.length && JSON.parse(data)
      }
    ]
  }, {
    name: 'header',
    validator: [
      data => {
        return (typeof data === 'string') && !!data.length && JSON.parse(data)
      }
    ]
  }, {
    name: 'method',
    validator: [
      data => {
        return (typeof data === 'string') && ['get', 'post'].includes(data)
      }
    ]
  })

  if(check) {
    return 
  }

  const [ header, method, body ] = Params.sanitizers(ctx.request.body, {
    name: 'header',
    sanitizers: [
      data => JSON.parse(data)
    ]
  }, {
    name: 'method',
    sanitizers: [
      data => data.toLowerCase() 
    ]
  }, 
  {
    name: 'body',
    sanitizers: [
      data => JSON.parse(data)
    ]
  })

  const { url } = ctx.request.body

  const data = await axios[method](url, {
    header,
    [method === 'get' ? 'params' : 'body']: body
  })
  .then(data => {
    return {
      data: data.data 
    }
  })
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data
  })

})

module.exports = router