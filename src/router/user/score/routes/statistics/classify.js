const Router = require('@koa/router')
const {
  SCORE_TYPE,
  dealErr,
  Params,
  responseDataDeal,
  ScoreMemoryModel,
  ScoreClassifyModel,
  ScorePrimaryClassifyModel
} = require('@src/utils')
const dayjs = require('dayjs')
const { isNil } = require('lodash')
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

router
  // 近15日每日任务完成数
  .get('/task/state', async (ctx) => {

    const [_id] = Params.sanitizers(ctx.query, {
      name: '_id',
      sanitizers: [
        function (data) {
          return ObjectId(data)
        }
      ]
    })

    const {
      dayCount = 15,
      state = SCORE_TYPE.DONE
    } = ctx.query

    //database
    const data = await ScoreMemoryModel.aggregate([
      {
        $match: {
          date: {
            $gte: dayjs().subtract(dayCount, 'day').startOf('day')
          },
          target_user: _id,
          score_type: SCORE_TYPE[state]
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" },
            day: { $dayOfMonth: "$date" },
          },
          total: { $sum: "$date" }
        }
      }
    ])
      .then(data => {
        return {
          data: {
            list: data.map(item => {
              return {
                label: `${item.year}-${item.month}-${item.day}`,
                value: item.total
              }
            })
          }
        }
      })
      .catch(dealErr(ctx))

    responseDataDeal({
      ctx,
      data
    })

  })
  // 任务完成次数top
  .get('/task/state/top', async (ctx) => {

    const [_id] = Params.sanitizers(ctx.query, {
      name: '_id',
      sanitizers: [
        data => ObjectId(data)
      ]
    },)

    const {
      count = 10,
      dayAfter = dayjs().subtract(1, 'year').startOf('day').format('YYYY-MM-DD'),
      state = SCORE_TYPE.DONE,
      primary = false
    } = ctx.query

    const data = await ScoreMemoryModel.aggregate([
      {
        $match: {
          date: {
            $gte: dayjs(dayAfter).toDate()
          },
          score_type: SCORE_TYPE[state]
        }
      },
      {
        $group: {
          _id: "$target_classify",
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: count
      }
    ])
      .then(statisticsData => {

        return Promise.all([
          ScorePrimaryClassifyModel.aggregate([
            {
              $project: {
                content: 1,
                _id: 1,
              }
            }
          ]),
          ScoreClassifyModel.aggregate([
            {
              $match: {
                _id: {
                  $in: statisticsData.map(item => ObjectId(item._id))
                }
              }
            },
            {
              $project: {
                _id: 1,
                content: 1,
                classify: 1
              }
            }
          ])
        ])
          .then((primaryData, classifyData) => {
            const nextStatisticsData = statisticsData.map(item => {
              const detail = classifyData.find(data => data._id === item._id)
              return {
                _id: item._id,
                value: item.count,
                label: detail.content
              }
            })
            // 统计各个总分类下面完成任务的数量
            if (primary) {
              return {
                data: {
                  data: primaryData.map(item => {
                    return {
                      label: item.content,
                      value: nextStatisticsData.some(data => {
                        return data.classify === item._id
                      }).length
                    }
                  })
                }
              }
            }
            // 统计各个二级分类下面任务的完成数量
            else {
              return {
                data: {
                  data: nextStatisticsData
                }
              }
            }
          })

        return {
          data: {
            list: data,
          }
        }
      })
      .catch(dealErr(ctx))

    responseDataDeal({
      ctx,
      data
    })

  })
  // 今年完成/未完成任务数
  .get('/task/state/year', async (ctx) => {

    const [_id] = Params.sanitizers(ctx.query, {
      name: '_id',
      sanitizers: [
        data => ObjectId(data)
      ]
    })

    const { state = SCORE_TYPE.DONE } = ctx.query

    const data = await ScoreMemoryModel.aggregate([
      {
        $match: {
          date: {
            $gte: dayjs().startOf('year').toDate()
          },
          score_type: SCORE_TYPE[state]
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 }
        }
      }
    ])
      .then(data => {

        return {
          data: {
            data: data[0]?.total || 0,
          }
        }
      })
      .catch(dealErr(ctx))

    responseDataDeal({
      ctx,
      data
    })

  })
  // 本月完成/未完成任务数
  .get('/task/state/month', async (ctx) => {

    const [_id] = Params.sanitizers(ctx.query, {
      name: '_id',
      sanitizers: [
        data => ObjectId(data)
      ]
    })

    const { state = SCORE_TYPE.DONE } = ctx.query

    const data = await ScoreMemoryModel.aggregate([
      {
        $match: {
          date: {
            $gte: dayjs().startOf('month').toDate()
          },
          score_type: SCORE_TYPE[state]
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 }
        }
      }
    ])
      .then(data => {

        return {
          data: {
            data: data[0]?.total || 0,
          }
        }
      })
      .catch(dealErr(ctx))

    responseDataDeal({
      ctx,
      data
    })

  })
  // 本周完成/未完成任务数
  .get('/task/state/week', async (ctx) => {

    const [_id] = Params.sanitizers(ctx.query, {
      name: '_id',
      sanitizers: [
        data => ObjectId(data)
      ]
    })

    const { state = SCORE_TYPE.DONE } = ctx.query

    const data = await ScoreMemoryModel.aggregate([
      {
        $match: {
          date: {
            $gte: dayjs().startOf('week').toDate()
          },
          score_type: SCORE_TYPE[state]
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 }
        }
      }
    ])
      .then(data => {

        return {
          data: {
            data: data[0]?.total || 0,
          }
        }
      })
      .catch(dealErr(ctx))

    responseDataDeal({
      ctx,
      data
    })

  })
  // 今日完成/未完成任务数
  .get('/task/state/today', async (ctx) => {

    const [_id] = Params.sanitizers(ctx.query, {
      name: '_id',
      sanitizers: [
        data => ObjectId(data)
      ]
    })

    const { state = SCORE_TYPE.DONE } = ctx.query

    const data = await ScoreMemoryModel.aggregate([
      {
        $match: {
          date: {
            $gte: dayjs().startOf('day').toDate()
          },
          score_type: SCORE_TYPE[state]
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 }
        }
      }
    ])
      .then(data => {

        return {
          data: {
            data: data[0]?.total || 0,
          }
        }
      })
      .catch(dealErr(ctx))

    responseDataDeal({
      ctx,
      data
    })

  })
  // 今日总任务数
  .get('/task/total/today', async (ctx) => {

    const [_id] = Params.sanitizers(ctx.query, {
      name: '_id',
      sanitizers: [
        data => ObjectId(data)
      ]
    })

    const data = await ScoreMemoryModel.aggregate([
      {
        $match: {
          date: {
            $gte: dayjs().startOf('day').toDate()
          },
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 }
        }
      }
    ])
      .then(data => {

        return {
          data: {
            data: data[0]?.total || 0,
          }
        }
      })
      .catch(dealErr(ctx))

    responseDataDeal({
      ctx,
      data
    })

  })



module.exports = router