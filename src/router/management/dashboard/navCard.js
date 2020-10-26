const Router = require('@koa/router')
const { UserModel, BehaviourSchema, GlobalModel, MovieModel, FeedbackModel, dealErr, notFound, responseDataDeal } = require('@src/utils')
const Day = require('dayjs')

const router = new Router()

const getDateAbout = () => {
  const nowDate = Day()
  const nowYear = nowDate.year()
  const nowMonth = nowDate.month()
  //几号
  const nowToday = nowDate.date()
  //周几
  const thisWeek = nowDate.day()
  //本周起始日期
  const thisStartWeek = new Date(nowYear, nowMonth, thisWeek == 0 ? nowToday - 6 : nowToday - thisWeek + 1).getTime()
  //上周起始日期
  const lastStartWeek = new Date(thisStartWeek - 7 * 24 * 60 * 60 * 1000).getTime()
  //今日起始
  const thisStartDay = new Date(nowYear, nowMonth, nowToday).getTime()
  //昨日起始
  const lastStartDay = new Date(thisStartDay - 24 * 60 * 60 * 1000).getTime()

  return {
    lastStartDay,
    thisStartDay,
    lastStartWeek,
    thisStartWeek
  }
}

const userStatistics = () => {
  const templateData = {
    total: 0,
    week_add: 0,
    day_add: 0,
    day_add_count: 0
  }

  return UserModel.find({})
  .select({
    createdAt: 1,
    _id: 0,
  })
  .exec()
  .then(data => {
    if(!Array.isArray(data)) return Promise.reject({ errMsg: 'data error', status: 404 })
    const total = data.length

    //上周新增
    let lastWeekCount = 0
    //本周新增
    let thisWeekCount = 0
    //昨日新增
    let lastDay = 0
    //今日新增
    let thisDay = 0

    const { 
      lastStartDay,
      thisStartDay,
      lastStartWeek,
      thisStartWeek
    } = getDateAbout()

    data.forEach(item => {
      const { createdAt } = item
      const millTime = new Date(createdAt).getTime()

      if(millTime >= thisStartWeek) {
        thisWeekCount ++
      }else if(millTime >= lastStartWeek) {
        lastWeekCount ++
      }

      if(millTime >= thisStartDay) {
        thisDay ++
      }else if(millTime >= lastStartDay) {
        lastDay ++
      }

    })

    return {
      ...templateData,
      total,
      week_add: ((thisWeekCount - lastWeekCount) / lastWeekCount).toFixed(3),
      day_add: ((thisDay - lastDay) / lastDay).toFixed(3),
      day_add_count: thisDay
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
  let today = new Date().getTime()
  const oneDay = 24 * 60 * 60 * 1000
  let dayArr = new Array(7).fill(0).map((_, index) => {
    return {
      count: 0,
      day: Day(today - oneDay * (index + 1) + 10000).format('YYYY-MM-DD'),
      date_area: [ today - oneDay * (index + 1), today - oneDay * index ]
    }
  })

  return Promise.all([
    BehaviourSchema.find({
      createdAt: { $gt: new Date(today - 7 * oneDay) }
    })
    .select({
      createdAt: 1,
      _id: 0
    }),
    GlobalModel.find({})
    .select({
      visit_count: 1,
      _id: 0
    })
    .exec()
  ])
  .then(([behaviout_data, visit_count]) => {
    if(!Array.isArray(behaviout_data) || !Array.isArray(visit_count)) return Promise.reject({ errMsg: 'data error', status: 404 })

    behaviout_data.forEach(current => {
      const { createdAt } = current
      const time = new Date(createdAt).getTime()
      dayArr = dayArr.map(item => {
        const { date_area, count } = item
        const [ start, end ] = date_area
        if(start <= time && end >= time) return {
          ...item,
          count: count + 1
        }
        return item
      })
    })

    return {
      ...templateData,
      total: visit_count.reduce((acc, cur) => {
        const { visit_count } = cur
        acc += typeof visit_count == 'number' ? visit_count : 0
        return acc
      }, 0),
      data: dayArr.map(item => {
        const { date_area, ...nextItem } = item
        return nextItem
      })
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
  let today = new Date().getTime()
  const oneDay = 24 * 60 * 60 * 1000
  let dayArr = new Array(7).fill(0).map((_, index) => {
    return {
      count: 0,
      day: Day(today - oneDay * (index + 1) + 10000).format('YYYY-MM-DD'),
      date_area: [ today - oneDay * (index + 1), today - oneDay * index ]
    }
  })
  const {
    lastStartDay,
    thisStartDay,
    lastStartWeek,
    thisStartWeek
  } = getDateAbout()

  return MovieModel.find({})
  .select({
    createdAt: 1,
    _id: 0
  })
  .exec()
  .then(data => {
    if(!Array.isArray(data)) return Promise.reject({ errMsg: 'data error', status: 404 })
    const total = data.length

    let thisWeekCount = 0
    let lastWeekCount = 0
    let thisDay = 0
    let lastDay = 0

    data.forEach(item => {
      const { createdAt } = item
      const millTime = new Date(createdAt).getTime()

      if(millTime >= thisStartWeek) {
        thisWeekCount ++
      }else if(millTime >= lastStartWeek) {
        lastWeekCount ++
      }

      if(millTime >= thisStartDay) {
        thisDay ++
      }else if(millTime >= lastStartDay) {
        lastDay ++
      }

      dayArr = dayArr.map(item => {
        const { date_area, count } = item
        const [ start, end ] = date_area
        if(start <= millTime && end >= millTime) return {
          ...item,
          count: count + 1
        }
        return item
      })

    })

    return {
      total,
      week_add: ((thisWeekCount - lastWeekCount) / lastWeekCount).toFixed(3),
      day_add: ((thisDay - lastDay) / lastDay).toFixed(3),
      day_count: thisDay,
      data: dayArr.map(item => {
        const { date_area, ...nextItem } = item
        return nextItem
      })
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
    transform_count: 0
  }

  const {
    lastStartDay,
    thisStartDay,
    lastStartWeek,
    thisStartWeek
  } = getDateAbout()

  return FeedbackModel.find({})
  .select({
    createdAt: 1,
    _id: 0,
    status: 1
  })
  .then(data => {
    if(!Array.isArray(data)) return Promise.reject({ errMsg: 'data error', status: 404 })

    const total = data.length

    let thisWeekCount = 0
    let lastWeekCount = 0
    let thisDay = 0
    let lastDay = 0
    let complete = 0

    data.forEach(item => {
      const { createdAt, status } = item
      const millTime = new Date(createdAt).getTime()

      if(millTime >= thisStartWeek) {
        thisWeekCount ++
      }else if(millTime >= lastStartWeek) {
        lastWeekCount ++
      }

      if(millTime >= thisStartDay) {
        thisDay ++
      }else if(millTime >= lastStartDay) {
        lastDay ++
      }

      if(status == 'DEAL') {
        complete ++
      }

    })

    return {
      ...templateData,
      total,
      transform_count: complete / total,
      week_add: ((thisWeekCount - lastWeekCount) / lastWeekCount).toFixed(3),
      day_add: ((thisDay - lastDay) / lastDay).toFixed(3),
      day_count: thisDay,
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

  const data = Promise.all([
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