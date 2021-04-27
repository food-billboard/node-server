const Router = require('@koa/router')
const { Types: { ObjectId } } = require('mongoose')
const { MEDIA_MAP } = require('../utils')
const { dealErr, responseDataDeal, Params, notFound } = require('@src/utils')

const router = new Router()

router
.get('/', async (ctx) => {
  const check = Params.query(ctx, {
    name: 'type',
    validator: [
      data => !!MEDIA_MAP[data]
    ]
  }, {
    name: '_id',
    validator: [
      data => ObjectId.isValid(data)
    ]
  })
  if(check) return 

  const { type } = ctx.query
  const model = MEDIA_MAP[type]

  const [ currPage, pageSize, _id ] = Params.sanitizers(ctx.query, {
    name: 'currPage',
    _default: 0,
    sanitizers: [
      data => data >= 0 ? +data : 0
    ]
  }, {
    name: 'pageSize',
    _default: 30,
    sanitizers: [
      data => data >= 0 ? +data : 30
    ]
  }, {
    name: '_id',
    sanitizers: [
      data => ObjectId(data)
    ]
  })

  const aggregate = [
    {
      $match: {
        _id
      }
    },
    {
      $skip: currPage * pageSize
    },
    {
      $limit: pageSize
    },
    {
      $lookup: {
        from: 'users',
        localField: 'white_list',
        foreignField: '_id',
        as: 'white_list'
      }
    },
    {
      $project: {
        data: {
          $map: {
            input: "$white_list",
            as: 'white_list',
            in: {
              createdAt: "$$white_list.createdAt",
              updatedAt: "$$white_list.updatedAt",
              username: "$$white_list.username",
              mobile: "$$white_list.mobile",
              email: "$$white_list.email",
              status: "$$white_list.status",
              roles: "$$white_list.roles",
              _id: "$$white_list._id",
            }
          }
        }
      }
    }
  ]

  const data = await Promise.all([
    model.aggregate([
      {
        $match: {
          _id
        }
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: 1
          }
        }
      }
    ]),
    model.aggregate(aggregate)
  ])
  .then(([total, data]) => {
    const list = Array.isArray(data) && data.length == 1 ? data[0].data : []
    return {
      data: {
        list,
        total: !!total.length ? total[0].total || 0 : 0,
      }
    }
  })
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    needCache: true,
    data
  })

})
.post('/', async (ctx) => {
  const check = Params.query(ctx, {
    name: 'type',
    validator: [
      data => !!MEDIA_MAP[data]
    ]
  }, {
    name: '_id',
    validator: [
      data => ObjectId.isValid(data)
    ]
  }, {
    name: 'user',
    validator: [
      data => data.split(',').every(item => ObjectId.isValid(item))
    ]
  })
  if(check) return 

  const { type } = ctx.query
  const model = MEDIA_MAP[type]

  const [ _id, users ] = Params.sanitizers(ctx.query, {
    name: '_id',
    sanitizers: [
      data => ObjectId(data)
    ]
  }, {
    name: 'user',
    sanitizers: [
      data => data.split(',').map(item => ObjectId(item))
    ]
  })

  const data = model.findOneAndUpdate({
    _id
  }, {
    $addToSet: {
      white_list: {
        $each: users
      }
    }
  })
  .select({
    _id: 1
  })
  .exec()
  .then(notFound)
  .then(data => ({ data: data._id }))
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    needCache: true,
    data
  })

})
.delete('/', async (ctx) => {
  const check = Params.query(ctx, {
    name: '_id',
    validator: [
      data => ObjectId.isValid(data)
    ]
  }, {
    name: 'type',
    validator: [
      data => !!MEDIA_MAP[data]
    ]
  }, {
    name: 'users',
    validator: [
      data => data.split(',').every(item => ObjectId.isValid(item.trim()))
    ]
  })
  if(check) return 

  const { type } = ctx.query
  const [ _id, users ] = Params.sanitizers(ctx.query, {
    name: '_id',
    sanitizers: [
      data => ObjectId(data)
    ]
  }, {
    name: 'users',
    sanitizers: [
      data => data.split(',').map(item => ObjectId(item.trim()))
    ]
  })
  const model = MEDIA_MAP[type]

  const data = await model.findOneAndUpdate({
    _id
  }, {
    $pullAll: {
      white_list: users
    }
  })
  .select({
    _id: 1
  })
  .exec()
  .then(data => {
    return {
      data: {
        data: data._id
      }
    }
  })
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data,
    needCache: false
  })
})

module.exports = router