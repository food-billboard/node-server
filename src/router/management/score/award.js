const Router = require('@koa/router')
const {
  verifyTokenToData,
  dealErr,
  Params,
  responseDataDeal,
  ScoreAwardModel,
  SCORE_EXCHANGE_CYCLE_TYPE
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
      inventory,
      exchange_score,
      award_cycle,
      enable,
    } = ctx.query

    let match = {}
    if(enable) {
      match.enable = enable 
    }
    if (content) {
      match.$or = [
        {
          award_name: {
            $regex: content,
            $options: 'gi'
          }
        },
        {
          award_description: {
            $regex: content,
            $options: 'gi'
          }
        },
      ]
    }
    if (inventory > 0) {
      match.inventory = inventory
    }
    if (exchange_score > 0) {
      match.exchange_score = exchange_score
    }
    if (award_cycle) {
      match.award_cycle = award_cycle
    }
    if (start_date) {
      match.createdAt = {
        $lte: end_date,
        $gte: start_date
      }
    }

    const data = await Promise.all([
      ScoreAwardModel.aggregate([
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
      ScoreAwardModel.aggregate([
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
          $lookup: {
            from: 'images',
            localField: 'award_image_list',
            foreignField: '_id',
            as: 'award_image_list'
          }
        },
        {
          $project: {
            _id: 1,
            award_name: 1,
            award_description: 1,
            create_user: "$create_user._id",
            create_user_avatar: "$create_user.avatar.src",
            create_user_name: "$create_user.username",
            inventory: 1,
            exchange_score: 1,
            award_cycle: 1,
            award_cycle_count: 1,
            createdAt: 1,
            updatedAt: 1,
            award_image_list: "$award_image_list.src",
            enable: 1
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
      name: 'award_name',
      validator: [
        data => !!data
      ]
    }, {
      name: 'inventory',
      validator: [
        data => data >= 0
      ]
    }, {
      name: 'exchange_score',
      validator: [
        data => data >= 0
      ]
    }, {
      name: 'award_image_list',
      validator: [
        data => data.split(',').every(item => ObjectId.isValid(item))
      ]
    }, {
      name: 'enable',
      validator: [
        data => ['ENABLE', 'DISABLE'].includes(data)
      ]
    })

    if (check) return

    const [award_cycle, award_image_list] = Params.sanitizers(ctx.request.body, {
      name: 'award_cycle',
      sanitizers: [
        data => SCORE_EXCHANGE_CYCLE_TYPE[data]
      ]
    }, {
      name: 'award_image_list',
      sanitizers: [
        data => data.split(',').map(item => ObjectId(item))
      ]
    })

    const {
      award_description = '',
      award_name,
      award_cycle_count,
      inventory,
      exchange_score,
      enable 
    } = ctx.request.body

    const [, token] = verifyTokenToData(ctx)
    const { id } = token

    const data = await ScoreAwardModel.findOne({
      award_name,
    })
      .select({
        _id: 1
      })
      .exec()
      .then()
      .then((data) => {
        if (data) return Promise.reject({ status: 400, errMsg: '名称重复' })
        const model = new ScoreAwardModel({
          create_user: ObjectId(id),
          award_description,
          award_name,
          award_cycle_count,
          inventory,
          exchange_score,
          award_cycle,
          award_image_list,
          enable
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
    const data = await ScoreAwardModel.deleteMany({
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
      name: 'award_name',
      validator: [
        data => !!data
      ]
    }, {
      name: 'inventory',
      validator: [
        data => data >= 0
      ]
    }, {
      name: 'exchange_score',
      validator: [
        data => data >= 0
      ]
    }, {
      name: 'award_image_list',
      validator: [
        data => data.split(',').every(item => ObjectId.isValid(item))
      ]
    })

    if (check) return

    const [award_cycle, award_image_list, _id] = Params.sanitizers(ctx.request.body, {
      name: 'award_cycle',
      sanitizers: [
        data => SCORE_EXCHANGE_CYCLE_TYPE[data]
      ]
    }, {
      name: 'award_image_list',
      sanitizers: [
        data => data.split(',').map(item => ObjectId(item))
      ]
    }, {
      name: '_id',
      sanitizers: [
        data => ObjectId(data)
      ]
    }, {
      name: 'enable',
      validator: [
        data => ['ENABLE', 'DISABLE'].includes(data)
      ]
    })

    const {
      award_description = '',
      award_name,
      award_cycle_count,
      inventory,
      exchange_score,
      enable 
    } = ctx.request.body

    const [, token] = verifyTokenToData(ctx)
    const { id } = token

    const data = await ScoreAwardModel.findOne({
      award_name,
      _id: {
        $nin: [_id]
      },
    })
      .select({
        _id: 1
      })
      .exec()
      .then(data => {
        if (data) return Promise.reject({ errMsg: '标题重复', status: 400 })
        return ScoreAwardModel.updateOne({
          _id,
          create_user: ObjectId(id)
        }, {
          $set: {
            award_description,
            award_name,
            award_cycle_count,
            inventory,
            exchange_score,
            award_cycle,
            award_image_list,
            enable 
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