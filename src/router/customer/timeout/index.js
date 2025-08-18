const Router = require('@koa/router')
const Image = require('./routes/image')
const {
  verifyTokenToData,
  dealErr,
  responseDataDeal,
  TimeoutModel,
  Params
} = require('@src/utils')
const dayjs = require('dayjs')
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

router
  // 获取
  .get('/', async (ctx) => {

    const [, token] = verifyTokenToData(ctx)
    const { id } = token

    const [currPage, pageSize, start_date, end_date] = Params.sanitizers(ctx.query, {
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
    })

    const {
      content = '',
    } = ctx.query

    let match = {
      create_user: ObjectId(id)
    }
    if (content) {
      match.$or = [
        {
          event_name: {
            $regex: content,
            $options: 'gi'
          }
        },
      ]
    }
    if (start_date) {
      match.start_date = {
        $lte: end_date,
        $gte: start_date
      }
    }

    const data = await Promise.all([
      TimeoutModel.aggregate([
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
      TimeoutModel.aggregate([
        {
          $match: match
        },
        {
          $sort: {
            start_date: -1
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
              create_user_id: "$create_user"
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    "$eq": ["$_id", "$$create_user_id"]
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
            as: 'create_user'
          }
        },
        {
          $unwind: {
            path: "$create_user",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $project: {
            _id: 1,
            event_name: 1,
            create_user: "$create_user._id",
            create_user_avatar: "$create_user.avatar.src",
            create_user_name: "$create_user.username",
            start_date: 1,
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
      name: 'event_name',
      validator: [
        data => !!data
      ]
    }, {
      name: 'start_date',
      validator: [
        data => !!data && dayjs(data).isValid()
      ]
    })

    if (check) return

    const {
      event_background,
      event_cover,
      event_name,
      start_date
    } = ctx.request.body

    const [, token] = verifyTokenToData(ctx)
    const { id } = token

    const data = await TimeoutModel.findOne({
      event_name,
      create_user: ObjectId(id)
    })
      .select({
        _id: 1
      })
      .exec()
      .then((data) => {
        if (data) return Promise.reject({ status: 400, errMsg: '名称重复' })
        const database = {
          create_user: ObjectId(id),
          event_name,
          start_date: dayjs(start_date).toDate()
        }
        if (event_background) {
          database.event_background = ObjectId(event_background)
        }
        if (event_cover) {
          database.event_cover = ObjectId(event_cover)
        }
        const model = new TimeoutModel(database)
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
    const data = await TimeoutModel.deleteMany({
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
      name: 'event_name',
      validator: [
        data => !!data
      ]
    }, {
      name: 'start_date',
      validator: [
        data => !!data && dayjs(data).isValid()
      ]
    })

    if (check) return

    const [_id] = Params.sanitizers(ctx.request.body, {
      name: '_id',
      sanitizers: [
        data => ObjectId(data)
      ]
    })

    const {
      event_background,
      event_cover,
      event_name,
      start_date
    } = ctx.request.body

    const [, token] = verifyTokenToData(ctx)
    const { id } = token

    const data = await TimeoutModel.findOne({
      award_name,
      _id: {
        $nin: [_id]
      },
      create_user: ObjectId(id)
    })
      .select({
        _id: 1
      })
      .exec()
      .then(data => {
        if (data) return Promise.reject({ errMsg: '标题重复', status: 400 })
        const updateData = {
          event_name,
          start_date: dayjs(start_date).toDate()
        }
        if (event_background) {
          updateData.event_background = ObjectId(event_background)
        }
        if (event_cover) {
          updateData.event_cover = ObjectId(event_cover)
        }
        return TimeoutModel.updateOne({
          _id,
          create_user: ObjectId(id)
        }, {
          $set: updateData
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
  .use('/image', Image.routes(), Image.allowedMethods())

module.exports = router