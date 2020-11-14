const Router = require('@koa/router')
const { UserModel, MovieModel, BehaviourModel, dealErr, responseDataDeal } = require('@src/utils')
const { getDateParams } = require('@src/router/management/utils')
const Day = require('dayjs')

const router = new Router()

//用户电影数据统计图
router
//注册用户
.get('/user', async(ctx) => {
  const { date_type, start_date, end_date, group, sort, templateList } = getDateParams(ctx)

  const data = await Promise.all([
    //注册用户统计
    UserModel.aggregate([
      {
        $match: {
          createdAt: {
            $gte: start_date,
            $lte: end_date
          }
        }
      },
      {
        $project: {
          createdAt: 1,
          _id: 0
        }
      },
      {
        $group: group
      },
      {
        $sort: sort
      }
    ])
    .exec(),
    //排行榜统计
    UserModel.aggregate([
      {
        $project: {
          username: 1,
          issue_count: {
            $size: {
              $ifNull: [
                '$issue', []
              ]
            }
          },
          hot: 1
        }
      },
      {
        $sort: {
          issue_count: -1,
          hot: -1
        }
      },
      {
        $limit: 10
      }
    ])
    .exec()
  ])
  .then(([register_user, rank_user]) => {

    if(!Array.isArray(register_user) || !Array.isArray(rank_user)) return Promise.reject({ errMsg: 'data error', status: 404 })

    const data = register_user.reduce((acc, cur) => {
      const { _id: { year, month, month_day, hour }, count } = cur
      let day
      if(date_type == 'week' || date_type == 'month') {
        day = Day(`${year}-${month}-${month_day}`).format('YYYY-MM-DD')
      }else if(date_type == 'year') {
        day = Day(`${year}-${month}`).format('YYYY-MM')
      }else if(date_type == 'day'){
        day = Day(`${year}-${month}-${month_day} ${hour}`).format('YYYY-MM-DD HH')
      }
      acc.push({
        day,
        count
      })
      return acc
    }, [])

    return {
      
      // {
      //   data: {
      //     data: [
      //       {
      //         day: '',
      //         count: ''
      //       }
      //     ],
      //     rank: [
      //       {
      //         name,
      //         _id,
      //         count,
      //         hot
      //       }
      //     ]
      //   }
      // }

      data: {
        data: templateList.map(item => {
          const { date, count } = item
          const [target={}] = data.filter(item => item.day == date)
          return {
            day: date,
            count: count + (target.count || 0)
          }
        }),
        rank: rank_user.map(item => {
          const { username, issue_count, ...nextItem } = item
          return {
            ...nextItem,
            name: username,
            count: issue_count
          }
        })
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
//用户上传
.get('/movie', async(ctx) => {
  const { date_type, start_date, end_date, group, sort, templateList } = getDateParams(ctx)

  const data = await Promise.all([
    UserModel.aggregate([
      {
        $match: {
          createdAt: {
            $gte: start_date,
            $lte: end_date
          }
        }
      },
      {
        $project: {
          createdAt: 1,
          _id: 0
        }
      },
      {
        $group: group
      },
      {
        $sort: sort
      }
    ])
    .exec(),
    MovieModel.aggregate([
      {
        $match: {
          source_type: "USER"
        }
      },
      {
        $project: {
          name: 1,
          count: "$hot",
        }
      },
      {
        $sort: {
          count: -1
        }
      },
      {
        $limit: 10
      }
    ])
    .exec()
  ])
  .then(([issue_statistics, movie_hot_statistics]) => {

    if(!Array.isArray(issue_statistics) || !Array.isArray(movie_hot_statistics)) return Promise.reject({ errMsg: 'data error', status: 404 })

    const data = issue_statistics.reduce((acc, cur) => {
      const { _id: { year, month, month_day, hour }, count } = cur
      let day
      if(date_type == 'week' || date_type == 'month') {
        day = Day(`${year}-${month}-${month_day}`).format('YYYY-MM-DD')
      }else if(date_type == 'year') {
        day = Day(`${year}-${month}`).format('YYYY-MM')
      }else if(date_type == 'day'){
        day = Day(`${year}-${month}-${month_day} ${hour}`).format('YYYY-MM-DD HH')
      }
      acc.push({
        day,
        count
      })
      return acc
    }, [])

    return {

      // {
      //   data: {
      //     data: [
      //       {
      //         day: '',
      //         count: ''
      //       }
      //     ],
      //     rank: [
      //       {
      //         name,
      //         _id,
      //         count,
      //       }
      //     ]
      //   }
      // }

      data: {
        data: templateList.map(item => {
          const { date, count } = item
          const [target={}] = data.filter(item => item.day == date)
          return {
            day: date,
            count: count + (target.count || 0)
          }
        }),
        rank: movie_hot_statistics
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
//用户访问统计(日 月 周 年)
.get('/visit', async(ctx) => {
  const { date_type, start_date, end_date, group, sort, templateList } = getDateParams(ctx)

  const data = await BehaviourModel.aggregate([
    {
      $match: {
        createdAt: {
          $lte: end_date,
          $gte: start_date
        }
      }
    },
    {
      $project: {
        createdAt: 1,
        _id: 0
      }
    },
    {
      $group: group
    },
    {
      $sort: sort
    }
  ])
  .then(visit_count => {
    if(!Array.isArray(visit_count)) return Promise.reject({ errMsg: 'data error', status: 404 })

    const data = visit_count.reduce((acc, cur) => {
      const { _id: { year, month, month_day, hour }, count } = cur
      let day
      if(date_type == 'week' || date_type == 'month') {
        day = Day(`${year}-${month}-${month_day}`).format('YYYY-MM-DD')
      }else if(date_type == 'year') {
        day = Day(`${year}-${month}`).format('YYYY-MM')
      }else if(date_type == 'day'){
        day = Day(`${year}-${month}-${month_day} ${hour}`).format('YYYY-MM-DD HH')
      }
      acc.push({
        day,
        count
      })
      return acc
    }, [])

    return {

      // [
      //   {
      //     day
      //     count
      //   }
      // ]

      data: templateList.map(item => {
        const { date, count } = item
        const [target={}] = data.filter(item => item.day == date)
        return {
          day: date,
          count: count + (target.count || 0)
        }
      })
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