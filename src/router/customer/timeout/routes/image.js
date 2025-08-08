const Router = require('@koa/router')
const {
  verifyTokenToData,
  dealErr,
  Params,
  responseDataDeal,
  TimeoutImageModel,
  SCORE_EXCHANGE_CYCLE_TYPE
} = require('@src/utils')
const dayjs = require('dayjs')
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

router
  // 获取
  .get('/', async (ctx) => {

    const check = Params.query(ctx, {
      name: 'event',
      validator: [
        (data) => {
          return ObjectId.isValid(data)
        }
      ]
    })
    if(check) return

    const [currPage, pageSize, start_date, end_date, event] = Params.sanitizers(ctx.query, {
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
      name: 'start_date',
      sanitizers: [
        function (data) {
          try {
            if (!data) return null
            const date = dayjs(data)
            return date.isValid() ? date.toDate() : null
          } catch (err) {
            return null
          }
        }
      ]
    }, {
      name: 'end_date',
      sanitizers: [
        function (data) {
          try {
            if (!data) return null
            const date = dayjs(data)
            return date.isValid() ? date.toDate() : null
          } catch (err) {
            return null
          }
        }
      ]
    }, {
      name: 'event',
      sanitizers: [
        data => ObjectId(data)
      ]
    })

    const {
      content = '',
    } = ctx.query

    let match = {}
    if (content) {
      match.$or = [
        {
          description: {
            $regex: content,
            $options: 'gi'
          }
        },
      ]
    }
    if (start_date) {
      match.createdAt = {
        $lte: end_date,
        $gte: start_date
      }
    }

    const data = await Promise.all([
      TimeoutImageModel.aggregate([
        {
          $match: match
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
      TimeoutImageModel.aggregate([
        {
          $match: match
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
            from: 'images',
            localField: 'image',
            foreignField: '_id',
            as: 'image'
          }
        },
        {
          $unwind: {
            path: "$image",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $project: {
            _id: 1,
            description: 1,
            image: "$image.src",
            create_date: 1,
            createdAt: 1,
            updatedAt: 1,
          }
        }
      ])
    ])
      .then(([total_data, data]) => {

        const [total = { total: 0 }] = total_data

        return {
          data: {
            list: data,
            total: total.total
          }
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
      name: 'create_date',
      validator: [
        data => !!data && dayjs(data).isValid()
      ]
    }, {
      name: 'event',
      validator: [
        data => ObjectId(data).isValid()
      ]
    }, {
      name: 'image',
      validator: [
        data => ObjectId(data).isValid()
      ]
    })

    if (check) return

    const [create_date, event, image] = Params.sanitizers(ctx.request.body, {
      name: 'create_date',
      sanitizers: [
        data => dayjs(data).format('YYYY-MM-DD HH:mm:ss')
      ]
    }, {
      name: 'event',
      sanitizers: [
        data => ObjectId(data)
      ]
    }, {
      name: 'image',
      sanitizers: [
        data => ObjectId(data)
      ]
    })

    const {
      address,
      description
    } = ctx.request.body

    const [, token] = verifyTokenToData(ctx)
    const { id } = token

    const data = await TimeoutImageModel.findOne({
      image,
      event
    })
      .select({
        _id: 1
      })
      .exec()
      .then()
      .then((data) => {
        if (data) return Promise.reject({ status: 400, errMsg: '图片重复' })
        const model = new TimeoutImageModel({
          event,
          address: address || [],
          description,
          create_date,
          image 
        })
        return model.save()
      })
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
  // 删除
  .delete('/', async (ctx) => {
    //validate params
    const check = Params.query(ctx, {
      name: '_id',
      validator: [
        data => data.split(',').every(data => ObjectId.isValid(data))
      ]
    })
    if (check) return

    const [_id] = Params.sanitizers(ctx.query, {
      name: '_id',
      sanitizers: [
        function (data) {
          return data.split(',').map(data => ObjectId(data))
        }
      ]
    })

    //database
    const data = await TimeoutImageModel.deleteMany({
      _id: {
        $in: _id
      }
    })
      .then(data => {
        if (data.deletedCount === 0) return Promise.reject({ errMsg: 'not found', status: 404 })
        return {
          data: null
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
    }, {
      name: 'create_date',
      validator: [
        data => !!data && dayjs(data).isValid()
      ]
    }, {
      name: 'event',
      validator: [
        data => ObjectId(data).isValid()
      ]
    }, {
      name: 'image',
      validator: [
        data => ObjectId(data).isValid()
      ]
    })

    if (check) return

    const [_id, create_date, event, image] = Params.sanitizers(ctx.request.body, {
      name: '_id',
      sanitizers: [
        data => ObjectId(data)
      ]
    }, {
      name: 'create_date',
      sanitizers: [
        data => dayjs(data).format('YYYY-MM-DD HH:mm:ss')
      ]
    }, {
      name: 'event',
      sanitizers: [
        data => ObjectId(data)
      ]
    }, {
      name: 'image',
      sanitizers: [
        data => ObjectId(data)
      ]
    })

    const {
      address,
      description
    } = ctx.request.body

    const [, token] = verifyTokenToData(ctx)
    const { id } = token

    const data = await TimeoutImageModel.findOne({
      image,
      event,
      _id: {
        $nin: [_id]
      }
    })
      .select({
        _id: 1
      })
      .exec()
      .then(data => {
        if (data) return Promise.reject({ errMsg: '图片重复', status: 400 })
        return TimeoutImageModel.updateOne({
          _id,
        }, {
          $set: {
            address: address || [],
            description,
            create_date,
            image 
          }
        })
      })
      .then(data => {
        if (data.nModified === 0) return Promise.reject({ status: 404, errMsg: 'not Found' })
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

module.exports = router