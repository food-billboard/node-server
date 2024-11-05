const Router = require('@koa/router')
const { 
  ScreenMediaClassifyModel,
  ScreenMediaModel,
  UserModel, 
  dealErr, 
  notFound, 
  Params, 
  responseDataDeal, 
  verifyTokenToData, 
} = require('@src/utils')
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

const checkParams = (ctx, ...params) => {
  return Params.body(ctx, {
    name: 'name',
    validator: [
      data => typeof data === 'string' && data.length > 0 && data.length < 20
    ]
  }, ...params)
}

router
.get('/', async(ctx) => {

  const [ currPage, pageSize ] = Params.sanitizers(ctx.query, {
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
  })

  const { content } = ctx.query
  let query = {}
  if(typeof content === 'string' && !!content){
    query = {
      name: {
        $regex: content,
        $options: 'gi'
      }
    }
  }

  let aggregate = [
    {
      $match: query,
    },
    {
      $skip: pageSize * currPage
    },
    {
      $limit: pageSize
    },
    {
      $project: {
        _id: 1,
        name: 1,
        createdAt: 1,
        updatedAt: 1,
      }
    }
  ]

  const data = await Promise.all([
    ScreenMediaClassifyModel.aggregate([
      {
        $match: query
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
    ScreenMediaClassifyModel.aggregate(aggregate)
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
    data,
    needCache: false
  })

})
.post('/', async(ctx) => {
  const check = checkParams(ctx)
  if(check) return

  const { request: { body: { name } } } = ctx

  const [, token] = verifyTokenToData(ctx)
  const { id } = token

  const data = await UserModel.findOne({
    _id: ObjectId(id)
  })
  .select({
    _id: 1,
  })
  .exec()
  .then(notFound)
  .then(data => {
    const { _id } = data
    const model = new ScreenMediaClassifyModel({
      name,
      user: _id
    })
    return model.save()
  })
  .then(data => {
    if(!data) return Promise.reject({ errMsg: 'unknown error', status: 500 })

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
.put('/', async(ctx) => {
  
  const check = checkParams(ctx)
  if(check) return

  const [ _id ] = Params.sanitizers(ctx.request.body, {
    name: '_id',
    sanitizers: [
      data => ObjectId(data)
    ]
  })
  const { request: { body: { name } } } = ctx
  
  const data = await ScreenMediaClassifyModel.updateOne({
    _id
  }, {
    $set: {
      name,
    }
  })
  .then(data => {
    if(data.nModified == 0) return Promise.reject({ errMsg: 'not found', status: 404 })

    return {
      data: {
        data: null
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
.delete('/', async(ctx) => {
  
  const [ _ids ] = Params.sanitizers(ctx.query, {
    name: '_id',
    sanitizers: [
      data => data.split(',').map(item => ObjectId(item.trim()))
    ]
  })

  const data = await ScreenMediaClassifyModel.deleteMany({
    _id: { $in: _ids }
  })
  .then(data => {
    if(data.deletedCount == 0) return Promise.reject({ errMsg: 'not found', status: 404 })
    return ScreenMediaModel.deleteMany({
      classify: { $in: _ids }
    })
  })
  .then(() => {
    return {
      data: {
        data: null
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