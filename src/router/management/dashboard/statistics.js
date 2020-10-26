const Router = require('@koa/router')
const { UserModel, MovieModel, BehaviourModel, dealErr, responseDataDeal, Params } = require('@src/utils')
const Day = require('dayjs')

const router = new Router()

const date_type = ["year", "month", "week", "day" ]
const date_value = {
  year: 365,
  month: 30,
  week: 7,
  day: 1
}

const getDateParams = (ctx) => {
  const [ dateType, start_date, end_date ] = Params.sanitizers(ctx.query, {
    name: 'date_type',
    sanitizers: [
      data => date_type.includes(data.toLowerCase()) ? data : 'week'
    ]
  }, {
    name: 'start_date',
    sanitizers: [
      data => (typeof data === 'string' && /\d{4}-\d{2}-\d{2}/.test(data)) ? Day(data).toDate() : undefined
    ]
  }, {
    name: 'end_date',
    sanitizers: [
      data => (typeof data === 'string' && /\d{4}-\d{2}-\d{2}/.test(data)) ? Day(data).toDate() : undefined
    ]
  })

  return {
    date_type: dateType,
    start_date,
    end_date
  }
}

//用户电影数据统计图
router
//注册用户
.get('/user', async(ctx) => {
  const { date_type, start_date, end_date } = getDateParams(ctx)

  let select = {
    createdAt: {
      $gte: !!start_date ? start_date : new Date(Date.now() - date_value[date_type || 'week']),
      $lte: !!end_date ? end_date : new Date()
    }
  }

  const data = await UserModel.find(select)
  .select({
    username: 1,
    createdAt: 1,
    issue: 1
  })
  .exec()
  .then(data => {
    if(!Array.isArray(data)) return Promise.reject({ errMsg: 'not found', status: 404 })

    const oneDay = 24 * 60 * 60 * 1000
    let today = !!end_date ? end_date.getTime() : new Date().getTime()
    let startDate = !!start_date ? start_date.getTime() : today - oneDay * (date_value[date_type] || 'week')
    const dayCount = Math.ceil((today - startDate) / oneDay)

    let dayArr = new Array(dayCount).fill(0).map((_, index) => {
      return {
        count: 0,
        day: Day(today - oneDay * (index + 1) + 10000).format('YYYY-MM-DD'),
        date_area: [ today - oneDay * (index + 1), today - oneDay * index ]
      }
    })
     
    const sortArr = data.sort((a, b) => {
      return b.issue.length - a.issue.length
    })

    data.forEach(item => {
      const { createdAt } = item
      const millTime = new Date(createdAt).getTime()
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
      data: dayArr.map(item => {
        const { date_area, ...nextItem } = item
        return nextItem
      }),
      rank: sortArr.slice(0, 10).map(item => {
        const { _id, username, issue } = item
        return {
          _id,
          name: username,
          count: issue.length
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
//用户上传
.get('/movie', async(ctx) => {
  const { date_type, start_date, end_date } = getDateParams(ctx)

  const data = await MovieModel.find({

  })
  .select({

  })
  .then(data => {

  })
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data,
    needCache: false
  })
})
//用户访问统计(日 月 年)
.get('/visit', async(ctx) => {
  const { date_type, start_date, end_date } = getDateParams(ctx)
  
  const data = await BehaviourModel.find({

  })
  .select({

  })
  .then(data => {

  })
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data,
    needCache: false
  })
})

module.exports = router