const Router = require('@koa/router')
const { verifyTokenToData, dealErr, Params, responseDataDeal, ScreenMockModel, notFound, loginAuthorization, getCookie, SCREEN_TYPE } = require('@src/utils')
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

router
// 获取mock数据
.post('/', async (ctx) => {

  function filter(data) {
    return data.filter(item => {
      const { key, type, dataKind } = item
      return !!key && [ 'string', 'number' ].includes(type) && ObjectId.isValid(dataKind)
    })
  }

  const check = Params.body(ctx, {
    name: 'fields',
    validator: [
      data => {
        return Array.isArray(data) && filter(data).length > 0 
      } 
    ]
  })

  if(check) {
    return 
  }

  const [ fields, total ] = Params.sanitizers(ctx.request.body, {
    name: 'fields',
    sanitizers: [
      data => filter(data)
    ]
  }, {
    name: 'total',
    sanitizers: [
      data => {
        const numberValue = parseInt(data)
        return numberValue > 0 ? numberValue : 1
      }
    ]
  })

  const { random } = ctx.request.body

  const data = await ScreenMockModel.aggregate([
    {
      $match: {
        _id: {
          $in: fields.map(item => item.dataKind)
        }
      }
    },
    {
      $project: {
        mock_data: 1 
      }
    }
  ])
  .then(data => {
    return {
      data: new Array(total).fill(0).map((_, index) => {
        
      })
    }
  })
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data
  })

})
// 数据类型枚举参数
.get('/params', async (ctx) => {

  const data = await ScreenMockModel.aggregate([
    {
      $project: {
        _id: 1,
        dataKind: 1 
      }
    }
  ])
  .then(data => {
    return {
      data 
    }
  })
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data
  })

})


module.exports = router