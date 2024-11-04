const Router = require('@koa/router')
const { 
  ScreenMediaModel,
  dealErr, 
  Params, 
  responseDataDeal, 
  verifyTokenToData, 
} = require('@src/utils')
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

const checkParams = (ctx, ...params) => {
  return Params.body(ctx, {
    name: '_id',
    validator: [
      data => ObjectId.isValid(data)
    ]
  }, ...params)
}

router
.get('/', async(ctx) => {

  const check = Params.query(ctx, {
    name: '_id',
    validator: [
      data => ObjectId.isValid(data)
    ]
  })
  if(check) return

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

  const { _id } = ctx.query
  let query = {
    classify: ObjectId(_id)
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
      $lookup: {
        from: 'images',
        localField: 'image',
        foreignField: '_id',
        as: 'image'
      }
    },
    {
      $unwind:{
        path:'$image',
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $project: {
        classify: 1,
        _id: 1,
        createdAt: 1,
        updatedAt: 1,
        src: "$image.src",
        image_id: "$image._id",
      }
    }
  ]

  const data = await Promise.all([
    ScreenMediaModel.aggregate([
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
    ScreenMediaModel.aggregate(aggregate)
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
  const check = checkParams(ctx, {
    name: 'image',
    validator: [
      data => ObjectId.isValid(data)
    ]
  })
  if(check) return

  const { request: { body: { image, _id } } } = ctx

  verifyTokenToData(ctx)

  const model = new ScreenMediaModel({
    image: ObjectId(image),
    classify: ObjectId(_id),
  })
  
  const data = await model.save()
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
.delete('/', async(ctx) => {
  
  const [ _ids ] = Params.sanitizers(ctx.query, {
    name: '_id',
    sanitizers: [
      data => data.split(',').map(item => ObjectId(item.trim()))
    ]
  })

  const data = await ScreenMediaModel.deleteMany({
    _id: { $in: _ids }
  })
  .then(data => {
    if(data.deletedCount == 0) return Promise.reject({ errMsg: 'not found', status: 404 })
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