const Router = require('@koa/router')
const { UserModel, BehaviourModel, GlobalModel, MovieModel, FeedbackModel, dealErr, notFound, responseDataDeal, FEEDBACK_STATUS } = require('@src/utils')
const Day = require('dayjs')
const { Aggregate } = require('mongoose')

const router = new Router()

const GMT_ADJUST = 8 * 60 * 60 * 1000
const DAY_MILL_TIME = 24 * 60 * 60 * 1000


const userStatistics = () => {
  const templateData = {
    total: 0,
    week_add: 0,
    day_add: 0,
    day_add_count: 0
  }

  const now = new Date()
  const millNow = now.getTime()
  const weekNow = now.getDay()

  const aggregate = new Aggregate()

  aggregate.model(UserModel)

  return Promise.all([
    UserModel.aggregate([
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
    .exec(),
    aggregate
    .match({
      createdAt: {
        $gte: new Date(millNow - 7 * DAY_MILL_TIME - (weekNow == 0 ? 6 : weekNow - 1) * DAY_MILL_TIME)
      }
    })
    .project({
      createdAt: 1,
      _id: 0
    })
    .group({
      _id: {
        year: {
          $year: "$createdAt"
        },
        // month: {
        //   $month: "$createdAt"
        // },
        // week: {
        //   $week: "$createdAt"
        // },
        week_day: {
          $dayOfWeek: "$createdAt"
        },
        day: {
          $dayOfYear: "$createdAt"
        }
      },
      count: {
        $sum: 1
      }
    })
    .sort({
      "_id.year": -1,
      "_id.day": -1
    })
  ])
  .then(([total_data, data]) => {
    if(!Array.isArray(data) || !Array.isArray(total_data)) return Promise.reject({ errMsg: 'data error', status: 404 })

    const [ total={ total: 0 } ] = total_data
    let week_count = {
      thisWeek: 0,
      lastWeek: 0
    }

    const [ today={ count: 0, week_day: 1, day: 1, year: new Date().getFullYear() }, yestoday={ count: 0 } ] = data

    let thisWeek = today.day - today.week_day 

    data.forEach(item => {
      const { _id: { day, year }, count } = item
      if(day - (today.year - year) * 356 <= thisWeek) {
        week_count.lastWeek += count
      }else {
        week_count.thisWeek += count
      }
    })

    return {
      total: total.total,
      week_add: (( week_count.thisWeek - week_count.lastWeek) / week_count.lastWeek == 0 ? 1 : week_count.lastWeek ).toFixed(3),
      day_add: ((today.count - yestoday.count) / (yestoday.count == 0 ? 1 : yestoday.count)).toFixed(3),
      day_add_count: today.count
    }
  })
  .catch(err => {
    console.log(err)
    return templateData
  })
}

const visitStatistics = () => {
  const templateData = {
    total: 0,
    data: []
  }
  let today = Date.now()

  return Promise.all([
    BehaviourModel.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(today - 7 * DAY_MILL_TIME)
          }
        }
      },
      {
        $project: {
          day: { $substr: [ { $add: [ "$createdAt" ] }, 0, 10 ] },
          _id: 0
        }
      },
      {
        $group: {
          _id: "$day",
          count: {
            $sum: 1
          }
        }
      },
      {
        $project: {
          _id: 0,
          day: "$_id",
          count: 1
        }
      }
    ]),
    GlobalModel.aggregate([
      {
        $group: {
          _id: null,
          total: {
            $sum: "$visit_count"
          } 
        }
      }
    ])
  ])
  .then(([behaviout_data, visit_count]) => {

    if(!Array.isArray(behaviout_data) || !Array.isArray(visit_count)) return Promise.reject({ errMsg: 'data error', status: 404 })

    return {
      total: visit_count.length ? visit_count[0].total : 0,
      data: behaviout_data
    }
  })
  .catch(err => {
    console.log(err)
    return templateData
  })

}

const dataStatistics = () => {
  
  const templateData = {
    total: 0,
    data: [],
    week_add: 0,
    day_add: 0,
    day_count: 0,
  }

  const now = new Date()
  const millNow = now.getTime()
  const day = now.getDay()

  const aggregate = new Aggregate()
  aggregate.model(MovieModel)

  return Promise.all([
    MovieModel.aggregate([
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
    .exec(),
    aggregate
    .match({
      createdAt: {
        $gte: new Date(millNow - 7 * DAY_MILL_TIME - (day == 0 ? 6 : day - 1) * DAY_MILL_TIME)
      }
    })
    .project({
      _id: 0,
      createdAt: 1
    })
    .group({
      _id: {
        day: {
          $dayOfYear: "$createdAt"
        },
        year: {
          $year: "$createdAt"
        },
        week_day: {
          $dayOfWeek: "$createdAt"
        },
        month_day: {
          $dayOfMonth: "$createdAt"
        },
        month: {
          $month: "$createdAt"
        }
      },
      count: {
        $sum: 1
      }
    })
    .sort({
      "_id.year": -1,
      "_id.day": -1
    })
  ])
  .then(([total_data, data]) => {
    if(!Array.isArray(data) || !Array.isArray(total_data)) return Promise.reject({ errMsg: 'data error', status: 404 })

    const [ total={ total: 0 } ] = total_data
    let week_count = {
      thisWeek: 0,
      lastWeek: 0
    }
    let statistics = []

    const [ today={ count: 0, week_day: 1, day: 1, year: new Date().getFullYear() }, yestoday={ count: 0 } ] = data

    let thisWeek = today.day - today.week_day 

    for(let i = data.length - 1; i >= 0; i --) {
      const { _id: { day, year, month, month_day }, count } = data[i]
      if(day - (today.year - year) * 356 <= thisWeek) {
        week_count.lastWeek += count
      }else {
        week_count.thisWeek += count
      }
      statistics.push({
        day: Day(`${year}-${month}-${month_day}`).format('YYYY-MM-DD'),
        count
      })
    }

    return {
      total: total.total,
      week_add: (( week_count.thisWeek - week_count.lastWeek ) / week_count.lastWeek == 0 ? 1 : week_count.lastWeek ).toFixed(3),
      day_add: ((today.count - yestoday.count) / (yestoday.count == 0 ? 1 : yestoday.count)).toFixed(3),
      day_count: today.count,
      data: statistics
    }
  })
  .catch(err => {
    console.log(err)
    return templateData
  })

}

const feedbackStatistics = () => {
  
  const templateData = {
    total: 0,
    week_add: 0,
    day_add: 0,
    day_add_count: 0,
    transform_count: 0
  }

  const now = new Date()
  const nowWeekDay = now.getDay()
  const nowMill = now.getTime()

  const aggregate = new Aggregate()
  aggregate.model(FeedbackModel)

  return Promise.all([
    FeedbackModel.aggregate([
      {
        $group: {
          _id: "$status",
          count: {
            $sum: 1
          },
        }
      }
    ])
    .exec(),
    aggregate
    .match({
      createdAt: {
        $gte: new Date(nowMill - ( 7 + nowWeekDay == 0 ? 6 : nowWeekDay - 1 ) * DAY_MILL_TIME)
      }
    })
    .project({
      _id: 0,
      createdAt: 1
    })
    .group({
      _id: {
        year: {
          $year: "$createdAt"
        },
        month: {
          $month: "$createdAt"
        },
        month_day: {
          $dayOfMonth: "$createdAt"
        },
        week_day: {
          $dayOfWeek: "$createdAt"
        },
        day: {
          $dayOfYear: "$createdAt"
        }
      },
      count: {
        $sum: 1
      }
    })
    .sort({
      "_id.year": -1,
      "_id.day": -1
    })
    .exec()
  ])
  .then(([total_data, data]) => {
    if(!Array.isArray(data) || !Array.isArray(total_data)) return Promise.reject({ errMsg: 'data error', status: 404 })

    let transform_count = 0
    const total = total_data.reduce((acc, cur) => {
      const { count, _id } = cur
      if(_id == FEEDBACK_STATUS.DEAL) transform_count = count
      acc += count
      return acc
    }, 0)

    let week_count = {
      thisWeek: 0,
      lastWeek: 0
    }
    // let statistics = []

    const [ today={ count: 0, week_day: 1, day: 1, year: new Date().getFullYear() }, yestoday={ count: 0 } ] = data

    let thisWeek = today.day - today.week_day 

    for(let i = data.length - 1; i >= 0; i --) {
      const { _id: { day, year, month, month_day }, count } = data[i]
      if(day - (today.year - year) * 356 <= thisWeek) {
        week_count.lastWeek += count
      }else {
        week_count.thisWeek += count
      }
      // statistics.push({
      //   date: Day(`${year}-${month}-${month_day}`).format('YYYY-MM-DD'),
      //   count
      // })
    }

    return {
      total,
      week_add: (( week_count.thisWeek - week_count.lastWeek ) / week_count.lastWeek == 0 ? 1 : week_count.lastWeek ).toFixed(3),
      day_add: ((today.count - yestoday.count) / (yestoday.count == 0 ? 1 : yestoday.count)).toFixed(3),
      day_add_count: today.count,
      // data: statistics
      transform_count: transform_count / (total == 0 ? 1 : total)
    }
  })
  .catch(err => {
    console.log(err)
    return templateData
  })

}

//导航卡片
router
.get('/', async(ctx) => {

  const data = await Promise.all([
    //用户量统计
    userStatistics(),
    //访问量统计
    visitStatistics(),
    //数据量统计
    dataStatistics(),
    //反馈量统计
    feedbackStatistics()
  ])
  .then(([user_count, visit_day, data_count, feedback_count]) => ({
    data: {
      user_count,
      visit_day,
      data_count,
      feedback_count
    }
  }))
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data,
    needCache: false
  })

})

module.exports = router