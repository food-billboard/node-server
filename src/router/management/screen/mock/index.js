const Router = require('@koa/router')
const Mock = require('mockjs')
const { 
  dealErr, 
  Params, 
  responseDataDeal, 
  ScreenMockModel, 
  SCREEN_MOCK_CONFIG_DATA_TYPE, 
  verifyTokenToData
} = require('@src/utils')
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

const valueCollection = {
  color: [],
  date: ['date_type', 'format'],
  address: ['address_type', 'prefix'],
  name: ['language_type', 'name_type'],
  image: ['width', 'height', 'color', 'word', 'word_color'],
  web: [],
  text: ['min', 'max', 'language_type', 'text_type'],
  number: ['min', 'max', 'decimal', 'dmin', 'dmax'],
  boolean: []
}

const DATE_MAX = 1000 * 10 

const valueGenerate = {
  color: () => {
    return new Array(DATE_MAX).fill(0).map(() => {
      return Mock.mock('@color')
    }) 
  },
  date: (value={}) => {
    try {
      const { date_type, format } = value
      const realFormat = format || 'YYYY-MM-DD'
      const realDateType = date_type || 'date'
      let str = `@${realDateType}("${realFormat}")`
      return new Array(DATE_MAX).fill(0).map(() => {
        let data = Mock.mock(str)
        return data
      })
    }catch(err) {
      return []
    }
  },
  address: (value={}) => {
    try {
      const { address_type, prefix=true } = value 
      return new Array(DATE_MAX).fill(0).map(() => {
        let str = `@${address_type}("${(address_type === 'city' || address_type === 'county') ? prefix : ''}")`
        let data = Mock.mock(str)
        return data
      })
    }catch(err) {
      return [] 
    }
  },
  web: () => {
    return new Array(DATE_MAX).fill(0).map(() => {
      return Mock.mock('@url')
    }) 
  },
  text: (value={}) => {
    try {
      const { min=1, max=20, language_type='chinese', text_type='title' } = value 
      let str = `@${(language_type === 'chinese') ? ('c' + text_type) : text_type}(${min},${max})`
      return new Array(DATE_MAX).fill(0).map(() => {
        let data = Mock.mock(str)
        return data
      })
    }catch(err) {
      return [] 
    }
  },
  image: (value={}) => {
    try {
      const { width=200, height=200, color, word, word_color } = value 
      return new Array(DATE_MAX).fill(0).map(() => {
        let data = Mock.Random.image(`${width}x${height}`, color || Mock.mock('@color'), word || Mock.mock('@ctitle(1, 10)'), word_color || Mock.mock('@color'))
        return data
      })
    }catch(err) {
      return [] 
    }
  },
  number: (value={}) => {
    try {
      const defaultMax = Math.pow(2, 30)
      const { min=-defaultMax, max=defaultMax, decimal=false, dmin=0, dmax=10 } = value 
      return new Array(DATE_MAX).fill(0).map(() => {
        if(decimal) return Mock.mock(`@float(${min}, ${max}, ${dmin}, ${dmax})`)
        return Mock.mock(`@integer(${min}, ${max}`)
      })
    }catch(err) {
      return [] 
    }
  },
  boolean: () => {
    return new Array(DATE_MAX).fill(0).map(() => {
      return Mock.mock('@boolean')
    }) 
  },
  name: (value={}) => {
    try {
      const { language_type='chinese', name_type='first-last' } = value 
      let realName = name_type 
      if(realName === 'first-last') realName = 'name' 
      if(language_type === 'chinese') realName = 'c' + realName
      return new Array(DATE_MAX).fill(0).map(() => {
        return Mock.mock(`@${realName}`)
      })
    }catch(err) {
      return [] 
    }
  }
}

router
.get('/', async (ctx) => {

  const { content, date_type } = Params.sanitizers(ctx.query, {
    name: 'content',
    sanitizers: [
      data => {
        if(typeof data === 'string' && !!data.length) {

          function reg(content) {
            return {
              $regex: content,
              $options: 'gi'
            }
          }

          let filter = [
            {
              data_kind: reg(data)
            },
            {
              description: reg(data)
            },
          ]

          return {
            done: true,
            data: {
              $or: filter
            }
          }
        }
        return {
          done: false 
        }
      }
    ]
  }, {
    name: 'date_type',
    sanitizers: [
      data => {
        if(typeof data !== 'string') {
          return {
            done: false,
          }
        }
        return {
          done: true,
          data: {
            config_type: {
              $in: data.split(',').map(item => item.trim())
            }
          }
        }
      },
    ]
  }, true)

  const data = await ScreenMockModel.aggregate([
    {
      $match: {
        ...content,
        ...date_type
      }
    },
    {
      $lookup: {
        from: 'users',
        let: { 
          create_user_id: "$user"
        },
        pipeline: [
          {
            $match: {
              $expr: {
                "$eq": [ "$_id", "$$create_user_id" ]
              },
            }
          },
          {
            $lookup: {
              from: 'images',
              as: 'avatar',
              foreignField: "_id",
              localField: "avatar"
            }
          },
          {
            $unwind: {
              path: "$avatar",
              preserveNullAndEmptyArrays: true 
            }
          },
        ],
        as: 'user'
      }
    },
    {
      $unwind: {
        path: "$user",
        preserveNullAndEmptyArrays: true 
      }
    },
    {
      $project: {
        _id: 1,
        data_kind: 1,
        description: 1,
        config_type: 1,
        user: {
          username: "$user.username",
          avatar: "$user.avatar.src",
          _id: "$user._id",
        },
        config: {
          date: "$date",
          address: "$address",
          name: "$name",
          text: "$text",
          color: "$color",
          image: "$image"
        },
        createdAt: 1,
        updatedAt: 1
      }
    }
  ])
  .then(data => {
    return {
      data: {
        total: data.length,
        list: data 
      }
    }
  })
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data
  })

})
.delete('/', async (ctx) => {

  const check = Params.query(ctx, {
    name: '_id',
    validator: [
      data => ObjectId.isValid(data)
    ]
  })

  if(check) return 

  const { _id } = ctx.query

  const data = await ScreenMockModel.deleteOne({
    _id: ObjectId(_id)
  })
  .then(data => {
    if(data && data.deletedCount == 0) return Promise.reject({ errMsg: 'not found', status: 404 })

    return {
      data: _id 
    }
  })
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data,
    needCache: false 
  })

})
.use(async (ctx, next) => {
  const check = Params.body(ctx, {
    name: 'data_kind',
    validator: [
      data => typeof data === 'string' && !!data 
    ]
  }, {
    name: 'config_type',
    validator: [
      data => Object.keys(SCREEN_MOCK_CONFIG_DATA_TYPE).includes(data)
    ]
  })

  if(check) return 

  await next() 

})
.post('/', async (ctx) => {

  const [, token] = verifyTokenToData(ctx)
  const { id } = token

  const { data_kind, config_type, config={}, description } = ctx.request.body

  const mock_data = valueGenerate[config_type] ? valueGenerate[config_type](config[config_type]) : []
  const targetConfig = valueCollection[config_type] ? valueCollection[config_type].reduce((acc, cur) => {
    acc[cur] = config[config_type] ? config[config_type][cur] : undefined
    return acc 
  }, {}) : {}

  const model = new ScreenMockModel({
    data_kind,
    config_type,
    mock_data: JSON.stringify(mock_data),
    [config_type]: targetConfig,
    description,
    user: ObjectId(id)
  })

  const data = await model.save()
  .then(data => {
    return {
      data: {
        _id: data._id 
      } 
    }
  })
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data
  })

})
.put('/', async (ctx) => {

  const check = Params.body(ctx, {
    name: '_id',
    validator: [
      data => ObjectId.isValid(data)
    ]
  })

  if(check) return 

  const [ _id ] = Params.sanitizers(ctx.request.body, {
    name: '_id',
    sanitizers: [
      data => ObjectId(data)
    ]
  })

  const { data_kind, config_type, config={}, description } = ctx.request.body

  const mock_data = valueGenerate[config_type] ? valueGenerate[config_type](config[config_type]) : []
  const targetConfig = valueCollection[config_type] ? valueCollection[config_type].reduce((acc, cur) => {
    acc[cur] = config[config_type] ? config[config_type][cur] : undefined
    return acc 
  }, {}) : {}

  const data = await ScreenMockModel.updateOne({
    _id,
  }, {
    $set: {
      data_kind,
      config_type,
      mock_data: JSON.stringify(mock_data),
      description,
      [config_type]: targetConfig
    }
  })
  .then(data => {
    if(data && data.nModified == 0) return Promise.reject({ errMsg: 'not found', status: 404 })
    return {
      data: {
        _id: data._id 
      } 
    }
  })
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data
  })

})


module.exports = router