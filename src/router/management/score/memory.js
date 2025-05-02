const Router = require('@koa/router')
const {
  verifyTokenToData,
  dealErr,
  Params,
  responseDataDeal,
  ExchangeMemoryModel,
  ScoreAwardModel,
  ScoreMemoryModel,
  UserModel,
  notFound,
  SCORE_EXCHANGE_CYCLE_TYPE
} = require('@src/utils')
const dayjs = require('dayjs')
const { isNil, isInteger } = require('lodash')
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

router
  // 积分记录列表
  .get('/obtain', async (ctx) => {

    const [start_date, end_date, currPage, pageSize] = Params.sanitizers(ctx.query, {
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

    const { content = '' } = ctx.query

    const data = await (content ? UserModel.aggregate([
      {
        username: {
          $regex: content,
          $options: 'gi'
        }
      },
      {
        $project: {
          _id: 1
        }
      }
    ]) : Promise.resolve())
      .then((users) => {
        let match = {}
        if (start_date) {
          match = {
            ...match,
            createdAt: {
              $lte: end_date,
              $gte: start_date
            }
          }
        }
        let $or = []
        if (users) {
          const userIds = users.map(item => item._id)
          $or.push(
            {
              target_user: {
                $in: userIds
              }
            },
            {
              create_user: {
                $in: userIds
              }
            }
          )
        }
        if (content) {
          $or.push({
            create_content: {
              $regex: content,
              $options: 'gi'
            }
          })
        }
        if ($or.length) {
          match.$or = $or
        }

        return Promise.all([
          ScoreMemoryModel.aggregate([
            ...Object.keys(match).length ? [{
              $match: match
            }] : [],
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
          ScoreMemoryModel.aggregate([
            ...Object.keys(match).length ? [{
              $match: match
            }] : [],
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
                  create_user_id: "$crate_user"
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
                as: 'crate_user'
              }
            },
            {
              $unwind: {
                path: "$crate_user",
                preserveNullAndEmptyArrays: true
              }
            },
            {
              $lookup: {
                from: 'users',
                let: {
                  target_user_id: "$target_user"
                },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        "$eq": ["$_id", "$$target_user_id"]
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
                as: 'target_user'
              }
            },
            {
              $unwind: {
                path: "$target_user",
                preserveNullAndEmptyArrays: true
              }
            },
            {
              $project: {
                _id: 1,
                target_score: 1,
                create_content: 1,
                create_description: 1,
                create_user: "$create_user._id",
                create_user_name: "$create_user.username",
                target_user: "$target_user._id",
                target_user_name: "$target_user.username",
                createdAt: 1,
                updatedAt: 1,
              }
            }
          ])
        ])
      })
      .then(([total_data, data]) => {

        const [total = { total: 0 }] = total_data

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
  // 积分
  .post('/obtain', async (ctx) => {

    const check = Params.body(ctx, {
      name: 'target_user',
      validator: [
        data => ObjectId.isValid(data)
      ]
    }, {
      name: 'create_content',
      validator: [
        data => !!data
      ]
    }, {
      name: 'target_score',
      validator: [
        data => data > 0 && isInteger(data)
      ]
    })

    if (check) return

    const [target_user, target_score] = Params.sanitizers(ctx.request.body, {
      name: 'target_user',
      sanitizers: [
        data => ObjectId(data)
      ]
    }, {
      name: 'target_score',
      _default: 1,
      sanitizers: [
        data => data >= 0 ? +data : 1
      ]
    })

    const {
      create_description = '',
      create_content = ''
    } = ctx.request.body

    const [, token] = verifyTokenToData(ctx)
    const { id } = token

    const model = new ScoreMemoryModel({
      create_description,
      create_content,
      target_user,
      target_score,
      create_user: ObjectId(id)
    })

    const data = await model.save()
      .then(data => {
        return UserModel.updateOne({
          _id: target_user
        }, {
          $inc: { score: target_score }
        })
          .then(() => {
            return {
              data: data._id
            }
          })
      })
      .catch(dealErr(ctx))

    responseDataDeal({
      ctx,
      data
    })

  })
  // 兑换记录列表
  .get('/exchange', async (ctx) => {

    const [start_date, end_date, check_start_date, check_end_date, currPage, pageSize] = Params.sanitizers(ctx.query, {
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
      name: 'check_start_date',
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
      name: 'check_end_date',
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

    const { content = '', checked } = ctx.query

    const data = await (content ? Promise.all([
      UserModel.aggregate([
        {
          $match: {
            username: {
              $regex: content,
              $options: 'gi'

            }
          },
        },
        {
          $project: {
            _id: 1
          }
        }
      ]),
      ScoreAwardModel.aggregate([
        {
          $match: {
            name: {
              $regex: content,
              $options: 'gi'

            }
          },
        },
        {
          $project: {
            _id: 1
          }
        }
      ])
    ]) : Promise.resolve([]))
      .then(([users, awards]) => {
        let match = {}
        if (!isNil(checked)) {
          match.check_date = {
            $exists: !!checked
          }
        }
        if (start_date) {
          match = {
            ...match,
            createdAt: {
              $lte: end_date,
              $gte: start_date
            }
          }
        }
        if (check_start_date) {
          match = {
            ...match,
            check_date: {
              $lte: check_end_date,
              $gte: check_start_date
            }
          }
        }
        let $or = []
        if (users) {
          const userIds = users.map(item => item._id)
          $or.push(
            {
              exchange_user: {
                $in: userIds
              }
            },
            {
              exchange_target: {
                $in: userIds
              }
            },
          )
        }
        if (awards) {
          const awardIds = awards.map(item => item._id)
          $or.push(
            {
              award: {
                $in: awardIds
              }
            },
          )
        }

        if ($or.length) {
          match.$or = $or
        }

        return Promise.all([
          ExchangeMemoryModel.aggregate([
            ...Object.keys(match).length ? [{
              $match: match
            }] : [],
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
          ExchangeMemoryModel.aggregate([
            ...Object.keys(match).length ? [{
              $match: match
            }] : [],
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
                  exchange_user_id: "$exchange_user"
                },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        "$eq": ["$_id", "$$exchange_user_id"]
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
                as: 'exchange_user'
              }
            },
            {
              $unwind: {
                path: "$exchange_user",
                preserveNullAndEmptyArrays: true
              }
            },
            {
              $lookup: {
                from: 'users',
                let: {
                  exchange_target_id: "$exchange_target"
                },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        "$eq": ["$_id", "$$exchange_target_id"]
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
                as: 'exchange_target'
              }
            },
            {
              $unwind: {
                path: "$exchange_target",
                preserveNullAndEmptyArrays: true
              }
            },
            {
              $lookup: {
                from: 'score_award',
                let: {
                  award_id: "$award"
                },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        "$eq": ["$_id", "$$award_id"]
                      },
                    }
                  },
                  {
                    $lookup: {
                      from: 'images',
                      as: 'award_image_list',
                      foreignField: "_id",
                      localField: "award_image_list"
                    }
                  },
                ],
                as: 'award'
              }
            },
            {
              $unwind: {
                path: "$award",
                preserveNullAndEmptyArrays: true
              }
            },
            {
              $project: {
                _id: 1,
                award_name: "$award.name",
                award_exchange_score: "$award.exchange_score",
                award_image_list: "$award.award_image_list.src",
                check_date: 1,
                exchange_target: "$exchange_target._id",
                exchange_target_name: "$exchange_target.username",
                exchange_user: "$exchange_user._id",
                exchange_user_name: "$exchange_user.username",
                createdAt: 1,
                updatedAt: 1,
              }
            }
          ])
        ])
      })
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
  // 兑换
  .post('/exchange', async (ctx) => {

    const check = Params.body(ctx, {
      name: 'target_user',
      validator: [
        data => ObjectId.isValid(data)
      ]
    }, {
      name: 'award',
      validator: [
        data => ObjectId.isValid(data)
      ]
    })

    if (check) return

    const [target_user, award] = Params.sanitizers(ctx.request.body, {
      name: 'target_user',
      sanitizers: [
        data => ObjectId(data)
      ]
    }, {
      name: 'award',
      sanitizers: [
        data => ObjectId(data)
      ]
    })

    const [, token] = verifyTokenToData(ctx)
    const { id } = token

    let _exchange_score = 0

    const data = await ScoreAwardModel.findOne({
      _id: award
    })
      .select({
        _id: 1,
        inventory: 1,
        exchange_score: 1,
        award_cycle: 1,
        award_cycle_count: 1,
      })
      .exec()
      .then(notFound)
      .then(data => {
        const { inventory, exchange_score, award_cycle, award_cycle_count } = data
        _exchange_score = exchange_score
        let targetDate
        switch (award_cycle) {
          case SCORE_EXCHANGE_CYCLE_TYPE.DAY:
            targetDate = dayjs().startOf('day').toDate()
            break
          case SCORE_EXCHANGE_CYCLE_TYPE.WEEK:
            targetDate = dayjs().startOf('week').toDate()
            break
          case SCORE_EXCHANGE_CYCLE_TYPE.MONTH:
            targetDate = dayjs().startOf('month').toDate()
            break
          case SCORE_EXCHANGE_CYCLE_TYPE.QUARTER:
            targetDate = dayjs().startOf('quarter').toDate()
            break
          case SCORE_EXCHANGE_CYCLE_TYPE.YEAR:
            targetDate = dayjs().startOf('year').toDate()
            break
        }
        return award_cycle === SCORE_EXCHANGE_CYCLE_TYPE.NONE ? Promise.resolve() : ExchangeMemoryModel.aggregate([
          {
            $match: {
              award,
              created: {
                $gte: targetDate
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
        ])
          .then(data => {
            const [total = { total: 0 }] = data
            if (total >= award_cycle_count) return Promise.reject({ errMsg: '超过兑换次数' })
          })
          .then(() => {
            if (!inventory) return Promise.reject({ status: 400, errMsg: '库存不足' })
            return UserModel.findOne({
              _id: target_user
            })
              .select({
                score: 1
              })
              .exec()
              .then(notFound)
          })
          .then(data => {
            const { score } = data
            if (score < exchange_score) return Promise.reject({ status: 400, errMsg: '积分不足' })
          })
      })
      .then(() => {
        const model = new ExchangeMemoryModel({
          exchange_target: target_user,
          exchange_user: id,
          award,
        })
        return model.save()
      })
      .then(data => {
        return UserModel.updateOne({
          _id: target_user
        }, {
          $inc: { score: -_exchange_score }
        })
          .then(() => {
            return {
              data: data._id
            }
          })
      })
      .catch(dealErr(ctx))

    responseDataDeal({
      ctx,
      data
    })

  })
  // 核销
  .put('/exchange', async (ctx) => {
    const check = Params.body(ctx, {
      name: '_id',
      validator: [
        data => ObjectId.isValid(data)
      ]
    })

    if (check) return

    const [_id] = Params.sanitizers(ctx.request.body, {
      name: '_id',
      sanitizers: [
        data => ObjectId(data)
      ]
    })

    const data = await ExchangeMemoryModel.updateOne({
      _id,
      check_date: {
        $exists: false
      }
    }, {
      $set: {
        check_date: new Date()
      }
    })
      .then(data => {
        if (data && data.nModified === 0) return Promise.reject({ status: 404, errMsg: '核销失败' })
        return {
          data: _id.toString()
        }
      })
      .catch(dealErr(ctx))

    responseDataDeal({
      ctx,
      data
    })
  })

module.exports = router