const Router = require('@koa/router')
const { Types: { ObjectId } } = require('mongoose')
const { MEDIA_MAP } = require('../utils')
const { dealErr, responseDataDeal, Params } = require('@src/utils')

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

  const { currPage, pageSize, _id } = Params.sanitizers(ctx.query, {
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
      match: {
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
      $project: {
        createdAt: 1,
        updatedAt: 1,
        username: 1,
        mobile: 1,
        email: 1,
        status: 1,
        roles: 1,
      }
    }
  ]

  const data = await Promise.all([
    model.aggregate([
      {
        match: {
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
    return {
      data: {
        list: data,
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

  const { _id, users } = Params.sanitizers(ctx.query, {
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
  .then(data => !!data && data._doc)
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
  .then(data => !!data && data._doc)
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