const Router = require('@koa/router')
const { verifyTokenToData, dealErr, notFound, Params, responseDataDeal, ScreenModal } = require('@src/utils')
const { Aggregate, Types: { ObjectId } } = require('mongoose')

const router = new Router()

router
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

  const { content } = ctx.query

  const data = await Promise.all([
    ScreenModal.aggregate([
      {
        $match: {
          name: {
            $regex: content,
            $options: 'gi'
          },
          user: {
            $in: [ObjectId(id)]
          }
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
          }
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
          updatedAt: 1
        }
      }
    ])
  ])
  .then(([total_data, data]) => {

    const [ total={ total: 0 } ] = total_data

    return {
      list: data,
      total
    }
  })
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data
  })

})
// 新增
.post('/', async (ctx) => {

  const check = Params.body(ctx, {
    name: 'name',
    validator: [
      data => typeof data === 'string' && data.length >= 5 && data.length < 20
    ]
  }, {
    name: 'data',
    validator: [
      data => typeof data === 'string' && !!JSON.parse(data)
    ]
  }, {
    name: 'flag',
    validator: [
      data => data === 'WEB' || data === 'H5'
    ]
  }, {
    name: 'poster',
    validator: [
      data => typeof data === 'string'
    ]
  })

  if(check) return 

  const [, token] = verifyTokenToData(ctx)
  const { id } = token

  const { description, name, data: componentData, flag, poster } = ctx.request.body

  const modal = new ScreenModal({
    name,
    data: componentData,
    user: ObjectId(id),
    flag,
    enable: false,
    poster,
    description
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

})
// 删除
.delete('/', async (ctx) => {

})
// 详情
.get('/detail', async (ctx) => {

})

module.exports = router