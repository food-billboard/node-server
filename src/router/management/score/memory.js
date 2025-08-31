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
  SCORE_EXCHANGE_CYCLE_TYPE,
  SCORE_TYPE
} = require('@src/utils')
const dayjs = require('dayjs')
const { isNil, isInteger } = require('lodash')
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

router
  // 积分记录列表
  .get('/obtain', async (ctx) => {

    const [start_date, end_date, currPage, pageSize, target_classify] = Params.sanitizers(ctx.query, {
      name: 'start_date',
      sanitizers: [
        function (data) {
          try {
            if (!data) return null
            const date = dayjs(data).startOf('day')
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
            const date = dayjs(data).endOf('day')
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
    }, {
      name: 'target_classify',
      sanitizers: [
        function (data) {
          try {
            if (!data) return null
            return ObjectId(data)
          } catch (err) {
            return null
          }
        }
      ]
    })

    const { content = '', score_type, target_score } = ctx.query

    const data = await (content ? UserModel.aggregate([
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
    ]) : Promise.resolve())
      .then((users) => {
        let match = {}
        if (start_date) {
          match = {
            ...match,
            date: {
              $lte: end_date,
              $gte: start_date
            }
          }
        }
        if(target_classify) {
          match = {
            ...match,
            target_classify
          }
        }
        if(!Number.isNaN(parseInt(target_score))) {
          match = {
            ...match,
            target_score: parseInt(target_score)
          }
        }
        if(SCORE_TYPE[score_type]) {
          match = {
            ...match,
            score_type: SCORE_TYPE[score_type]
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
              $lookup: {
                from: 'score_classifies',
                let: {
                  target_id: "$target_classify"
                },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        "$eq": ["$_id", "$$target_id"]
                      },
                    }
                  },
                  {
                    $lookup: {
                      from: 'score_primary_classifies',
                      as: 'classify',
                      foreignField: "_id",
                      localField: "classify"
                    }
                  },
                  {
                    $unwind: {
                      path: "$classify",
                      preserveNullAndEmptyArrays: true
                    }
                  },
                  {
                    $lookup: {
                      from: 'images',
                      as: 'image',
                      foreignField: "_id",
                      localField: "image"
                    }
                  },
                  {
                    $unwind: {
                      path: "$image",
                      preserveNullAndEmptyArrays: true
                    }
                  },
                ],
                as: 'target_classify'
              }
            },
            {
              $unwind: {
                path: "$target_classify",
                preserveNullAndEmptyArrays: true
              }
            },
            {
              $project: {
                date: 1,
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
                score_type: 1,
                target_classify: "$target_classify._id",
                target_classify_image: "$target_classify.image.src",
                target_classify_name: "$target_classify.content",
                target_primary_classify: "$target_classify.classify._id",
                target_primary_classify_name: "$target_classify.classify.content",
                start_time: 1,
                end_time: 1
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
  // 积分
  .put('/obtain', async (ctx) => {

    const check = Params.body(ctx, {
      name: '_id',
      validator: [
        data => ObjectId.isValid(data)
      ]
    }, {
      name: 'target_score',
      validator: [
        data => isInteger(data)
      ]
    }, {
      name: 'score_type',
      validator: [
        data => !!SCORE_TYPE[data]
      ]
    })

    if (check) return

    const [_id, target_score] = Params.sanitizers(ctx.request.body, {
      name: '_id',
      sanitizers: [
        data => ObjectId(data)
      ]
    }, {
      name: 'target_score',
      _default: 1,
      sanitizers: [
        data => Math.abs(data) || 0
      ]
    })

    const {
      create_description = '',
      create_content = '',
      score_type
    } = ctx.request.body

    const [, token] = verifyTokenToData(ctx)
    const { id } = token

    let updateData = {
      score_type,
      target_score,
      create_user: ObjectId(id)
    }
    if(create_content) {
      updateData = {
        ...updateData,
        create_content
      }
    }
    if(create_description) {
      updateData = {
        ...updateData,
        create_description
      }
    }

    const data = await ScoreMemoryModel.findOne({
      _id
    })
    .select({
      target_score: 1,
      target_user: 1
    })
    .exec()
    .then(notFound)
    .then(data => {
      const { target_score: originScore, target_user } = data 
      return ScoreMemoryModel.updateOne({
        _id 
      }, {
        $set: updateData
      })
      .then(data => {
        if(data.nModified === 0) return Promise.reject({ errMsg: 'error', status: 404 })
          return UserModel.updateOne({
            _id: target_user
          }, {
            $inc: { score: target_score - originScore }
          })
      })
    })
    .then(() => {
      return {
        data: _id 
      }
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
                from: 'score_awards',
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
                award: "$award",
                award_name: "$award.award_name",
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
              createdAt: {
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
            if (total.total >= award_cycle_count) return Promise.reject({ errMsg: '超过兑换次数', status: 400 })
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