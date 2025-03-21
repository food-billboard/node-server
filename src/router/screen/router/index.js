const Router = require('@koa/router')
const { verifyTokenToData, dealErr, Params, responseDataDeal, ScreenModal, loginAuthorization, SCREEN_TYPE } = require('@src/utils')
const { Types: { ObjectId } } = require('mongoose')
const savePool = require('./save-pool')

const router = new Router()

router
// 流式保存
.use('/pool', savePool.routes(), savePool.allowedMethods())
.use(loginAuthorization())
// 列表
.get('/', async (ctx) => {

  const [, token] = verifyTokenToData(ctx)
  const { id } = token

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

  const { content='', flag='' } = ctx.query

  const data = await Promise.all([
    ScreenModal.aggregate([
      {
        $match: {
          name: {
            $regex: content,
            $options: 'gi'
          },
          user: ObjectId(id),
          ...(flag ? {
            flag: {
              $in: [flag]
            }
          } : {})
        }
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: 1
          }
        }
      },
      {
        $project: {
          _id: 0,
          total: 1
        }
      }
    ]),
    ScreenModal.aggregate([
      {
        $match: {
          name: {
            $regex: content,
            $options: 'gi'
          },
          user: {
            $in: [ObjectId(id)]
          },
          ...(flag ? {
            flag: {
              $in: [flag]
            }
          } : {})
        }
      },
      {
        $sort: {
          updatedAt: -1
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
          name: 1,
          user: {
            username: "$user.username",
            avatar: "$user.avatar.src",
            _id: "$user._id",
          },
          enable: 1,
          flag: 1,
          description: 1,
          poster: 1,
          createdAt: 1,
          updatedAt: 1,
          version: 1
        }
      }
    ])
  ])
  .then(([total_data, data]) => {

    const [ total={ total: 0 } ] = total_data

    return {
      list: data,
      total: total.total 
    }
  })
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data
  })

})
// 删除
.delete('/', async (ctx) => {
  const check = Params.query(ctx, {
    name: '_id',
    validator: [
      data => ObjectId.isValid(data)
    ]
  })

  if(check) return 

  const [, token] = verifyTokenToData(ctx)
  const { id } = token
  const { _id } = ctx.query

  const data = await ScreenModal.deleteOne({
    _id: ObjectId(_id),
    user: ObjectId(id)
  })
  .then(data => {
    if(data && data.deletedCount == 0) return Promise.reject({ errMsg: 'forbidden', status: 403 })

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
.use('/', async (ctx, next) => {

  const check = Params.body(ctx, {
    name: 'name',
    validator: [
      data => typeof data === 'string' && data.length >= 5 && data.length < 20
    ]
  }, {
    name: 'data',
    validator: [
      data => {
        return (typeof data === 'string') && !!data.length
      }
    ]
  }, {
    name: 'flag',
    validator: [
      data => Object.keys(SCREEN_TYPE).includes(data)
    ]
  }, {
    name: 'poster',
    validator: [
      data => typeof data === 'string' && !!data.length
    ]
  }, {
    name: 'version',
    validator: [
      data => typeof data === 'string' && !!data.length
    ]
  })

  if(check) {
    return 
  }

  await next() 

})
// 新增
.post('/', async (ctx) => {

  const [, token] = verifyTokenToData(ctx)
  const { id } = token

  const { description, name, data: componentData, flag, poster, version } = ctx.request.body

  const model = new ScreenModal({
    name,
    data: componentData,
    user: ObjectId(id),
    flag,
    enable: false,
    poster,
    description,
    version
  })

  const data = await model.save()
  .then(data => {
    return {
      data: data._id 
    }
  })
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data
  })

})
// 修改
.put('/', async (ctx) => {

  const check = Params.body(ctx, {
    name: '_id',
    validator: [
      data => ObjectId.isValid(data)
    ]
  })

  if(check) return 

  const [, token] = verifyTokenToData(ctx)
  const { id } = token

  const { description, name, data: componentData, flag, poster, _id, version } = ctx.request.body

  const data = await ScreenModal.updateOne({
    _id: ObjectId(_id),
    user: ObjectId(id),
  }, {
    $set: {
      description,
      name,
      data: componentData,
      flag,
      poster,
      version
    }
  })
  .exec()
  .then(data => {
    if(data && data.nModified == 0) return Promise.reject({ errMsg: 'forbidden', status: 403 })
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

module.exports = router