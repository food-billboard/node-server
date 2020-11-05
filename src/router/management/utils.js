const { Params } = require('@src/utils')
const Day = require('dayjs')

const getDateParams = (ctx) => {

  let [ dateType, start_date, end_date ] = Params.sanitizers(ctx.query, {
    name: 'date_type',
    sanitizers: [
      data => typeof data === 'string' && date_type.includes(data.toLowerCase()) ? data : 'week'
    ]
  }, {
    name: 'start_date',
    sanitizers: [
      data => (typeof data === 'string' && /\d{4}-\d{2}-\d{2}(-\d{2})?/.test(data)) ? Day(data) : undefined
    ]
  }, {
    name: 'end_date',
    sanitizers: [
      data => (typeof data === 'string' && /\d{4}-\d{2}-\d{2}(-\d{2})?/.test(data)) ? Day(data) : undefined
    ]
  })

  let _dateType = dateType == 'week' ? 'isoWeek' : dateType

  if(!start_date && !end_date) {
    start_date = Day().startOf(_dateType)
    end_date = Day().endOf(_dateType)
  }else if(!!start_date && !end_date) {
    end_date = Day().endOf(_dateType)
  }else if(!start_date && !!end_date){
    start_date = end_date.subtract(1, dateType)
    if(dateType == 'day') start_date = start_date.add(1, 'd')
  }

  //基础数据列表
  let templateList = []
  //group筛选
  let group = {
    count: {
      $sum: 1
    }
  }
  //sort排序
  let sort = {
    "_id.year": 1
  }
  let _start_date = start_date
  let _end_date = end_date

  if(dateType == 'year') {
    group = {
      ...group,
      _id: {
        year: {
          $year: "$createdAt"
        },
        month: {
          $month: "$createdAt"
        }
      },
    }
    sort = {
      ...sort,
      "_id.month": 1
    }
    let startYear = _start_date.year()
    const endYear = _end_date.year()
    let startMonth = _start_date.month()
    const endMonth = _end_date.month()
    while(startYear != endYear || startMonth != endMonth) {
      templateList.push({
        year: startYear,
        month: startMonth + 1,
        date: Day(`${startYear}-${startMonth + 1}`).format('YYYY-MM'),
        count: 0
      })
      _start_date = _start_date.add(1, 'month')
      startYear = _start_date.year()
      startMonth = _start_date.month()
    }
    templateList.push({
      year: endYear,
      month: endMonth + 1,
      date: Day(`${endYear}-${endMonth + 1}`).format('YYYY-MM'),
      count: 0
    })
  }else if(dateType == 'month') {
    group = {
      ...group,
      _id: {
        year: {
          $year: "$createdAt"
        },
        month: {
          $month: "$createdAt"
        },
        day: {
          $dayOfYear: "$createdAt"
        },
        month_day: {
          $dayOfMonth: "$createdAt"
        }
      }
    }
    sort = {
      ...sort,
      "_id.day": 1
    }
    let startYear = _start_date.year()
    const endYear = _end_date.year()
    let startMonth = _start_date.month()
    const endMonth = _end_date.month()
    let startDate = _start_date.date()
    const endDate = _end_date.date()
    while(startYear != endYear || startMonth != endMonth || startDate != endDate) {
      templateList.push({
        year: startYear,
        month: startMonth + 1,
        day: startDate,
        date: Day(`${startYear}-${startMonth + 1}-${startDate}`).format('YYYY-MM-DD'),
        count: 0
      })
      _start_date = _start_date.add(1, 'd')
      startYear = _start_date.year()
      startMonth = _start_date.month()
      startDate = _start_date.date()
    }
    templateList.push({
      year: endYear,
      month: endMonth + 1,
      day: endDate,
      date: Day(`${endYear}-${endMonth + 1}-${endDate}`).format('YYYY-MM-DD'),
      count: 0
    })
  }else if(dateType == 'week') {
    group = {
      ...group,
      _id: {
        year: {
          $year: "$createdAt"
        },
        month: {
          $month: "$createdAt"
        },
        day: {
          $dayOfYear: "$createdAt"
        },
        month_day: {
          $dayOfMonth: "$createdAt"
        },
        week_day: {
          $dayOfWeek: "$createdAt"
        }
      }
    }
    sort = {
      ...sort,
      "_id.day": 1
    }
    let startYear = _start_date.year()
    const endYear = _end_date.year()
    let startMonth = _start_date.month()
    const endMonth = _end_date.month()
    let startDate = _start_date.date()
    const endDate = _end_date.date()
    while(startYear != endYear || startMonth != endMonth || startDate != endDate) {
      templateList.push({
        year: startYear,
        month: startMonth + 1,
        day: startDate,
        weekOfWeek: _start_date.isoWeekday(),
        date: Day(`${startYear}-${startMonth + 1}-${startDate}`).format('YYYY-MM-DD'),
        count: 0
      })
      _start_date = _start_date.add(1, 'd')
      startYear = _start_date.year()
      startMonth = _start_date.month()
      startDate = _start_date.date()
    }
    templateList.push({
      year: endYear,
      month: endMonth + 1,
      day: endDate,
      weekOfWeek: _end_date.isoWeekday(),
      date: Day(`${endYear}-${endMonth + 1}-${endDate}`).format('YYYY-MM-DD'),
      count: 0
    })
  }else {
    group = {
      ...group,
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
        hour: {
          $hour: "$createdAt"
        }
      }
    }
    sort = {
      ...sort,
      "_id.month_day": 1,
      "_id.year.hour": 1
    }
    let startYear = _start_date.year()
    const endYear = _end_date.year()
    let startMonth = _start_date.month()
    const endMonth = _end_date.month()
    let startDate = _start_date.date()
    const endDate = _end_date.date()
    let startHour = _start_date.hour()
    const endHour = _end_date.hour()

    while(startYear != endYear || startMonth != endMonth || startDate != endDate || startHour != endHour) {
      templateList.push({
        year: startYear,
        month: startMonth + 1,
        day: startDate,
        hour: startHour,
        date: Day(`${startYear}-${startMonth + 1}-${startDate} ${startHour}`).format('YYYY-MM-DD HH'),
        count: 0
      })
      _start_date = _start_date.add(1, 'hour')
      startYear = _start_date.year()
      startMonth = _start_date.month()
      startDate = _start_date.date()
      startHour = _start_date.hour()
    }
    templateList.push({
      year: endYear,
      month: endMonth + 1,
      day: endDate,
      hour: endHour,
      date: Day(`${endYear}-${endMonth + 1}-${endDate} ${endHour}`).format('YYYY-MM-DD HH'),
      count: 0
    })
  }

  return {
    date_type: dateType,
    start_date: start_date.toDate(),
    end_date: end_date.toDate(),
    templateList,
    group,
    sort
  }
}

const date_type = ["year", "month", "week", "day" ]

module.exports = {
  getDateParams,
  date_type
}