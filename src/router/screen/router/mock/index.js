const Router = require('@koa/router')
const { dealErr, Params, responseDataDeal, ScreenMockModel } = require('@src/utils')
const { Types: { ObjectId } } = require('mongoose')
const { shuffle } = require('lodash')

const router = new Router()

router
// 获取mock数据
.post('/', async (ctx) => {

  function filter(data) {
    return data.filter(item => {
      const { key, dataKind, type } = item
      return !!key && ObjectId.isValid(dataKind)
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
          $in: fields.map(item => ObjectId(item.dataKind))
        }
      }
    },
    {
      $project: {
        mock_data: 1,
        _id: 1 
      }
    }
  ])
  .then(data => {

    const fieldsWithData = fields.map(item => {
      const { dataKind } = item 
      const target = data.find(item => {
        return item._id.equals(dataKind)
      })
      let dataSource = []
      try {
        dataSource = JSON.parse(target.mock_data)
      }catch(err) {

      }

      if(random === '1') {
        dataSource = shuffle(dataSource)
      }

      return {
        ...item,
        dataSource
      }
    })

    return {
      data: new Array(total).fill(0).map((_, index) => {
        return fieldsWithData.reduce((acc, item) => {
          const { key, dataSource } = item 
          acc[key] = dataSource[index]
          return acc  
        }, {})
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
        data_kind: 1,
        description: 1
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