const Router = require('@koa/router')
const { MovieModel, SearchModel, dealErr, responseDataDeal } = require('@src/utils')
const { getDateParams } = require('@src/router/management/utils')
const Day = require('dayjs')

const router = new Router()

// "total",
// "average": "人均搜索量",
// "count_total_day": "日同比",
// "count_average_day": "日同比",
// total_chart: [{
//   day,
//   count
// }]
// average_chart: [{
//   day,
//   count
// }]
// data: [{
//   _id,
//   key_word: "关键字",
//   count: 搜索数量,
//   week_count: 周同比(较上周新增百分比),

// }]

router
//热搜
.get('/keyword', async(ctx) => {

  const [ currPage, pageSize, hot ] = Params.sanitizers(ctx.query, {
    name: 'currPage',
    _default: 0,
    sanitizers: [
      data => data >= 0 ? data : 0
    ]
  }, {
    name: 'pageSize',
    _default: 30,
    sanitizers: [
      data => data >= 0 ? data : 30
    ]
  }, {
    name: 'hot',
    sanitizers: [
      data => parseInt(data),
      data => Number.isNaN(data) ? -1 : data > 0 ? 1 : -1
    ]
  })

  const data = await Promise.all([
    //关键词总数
    SearchModel.aggregate([
      {
        $project: {
          _id: 1
        }
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: 1
          },
          search_total: {
            $sum: "$hot"
          }
        }
      }
    ]),
    //最近7天的搜索用户数量
    SearchModel.aggregate([
      {
        $unwind: 'hot'
      },
      {
        $match: {
          hot: {
            $gte: Day().subtract(7, 'd').toDate(),
            $lte: Day().toDate()
          }
        }
      },
      {
        $group: {
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
            key_word: "$key_word",
            createdAt: "$createdAt"
          },
          count: {
            $sum: 1
          },
        }
      },
      {
        $sort: {
          "_id.day": 1
        }
      }
    ]),
    //数据统计
    SearchModel.aggregate([
      {
        $unwind: "hot"
      },
      {
        $project: {
          key_word: 1,
          hot: {
            $size: {
              $ifNull: [
                "$hot", []
              ]
            }
          },
        },
      },
      {
        $sort: {
          hot
        }
      },
      {
        $skip: currPage * pageSize
      },
      {
        limit: pageSize
      },
    ])
  ])
  .then(([ key_word_total, search_data, search_list ]) => {

    const { total=0, search_total=0 } = key_word_total.length ? key_word_total[0] : {}
    
    //搜索数据图
    let total_chart = []
    //人均搜索数据图
    let average_chart = []
    //最后一天的搜索关键词
    let last_day_count = 0
    const doc = new Array(7).fill(0).map((_, index) => ({ day: Day().subtract(7 - index, 'd'), count: 0 }))

    doc.forEach((item, index) => {
      const { day } = item
      const target = search_data.filter(val => {
        const { _id: { month_day } } = val
        return month_day == day.date()
      })

      const count = target.reduce((acc, cur) => {
        const { count, _id: { createdAt } } = cur
        if(index == 6 && Day(createdAt).date() == day.date()) last_day_count ++
        acc += count
        return acc
      }, 0)

      total_chart.push({
        ...item,
        count,
        day: day.format('YYYY-MM-DD')
      })
      average_chart.push({
        ...item,
        count: count / target.length,
        day: day.format('YYYY-MM-DD')
      })

    })

    //用户平均搜索
    const average = total == 0 ? 0 : (search_total / total)
    //昨日搜索量
    const yestoday_search_total = total_chart[total_chart.length - 1].count
    //截止昨日搜索量
    const yestoday_total = total - yestoday_search_total
    //昨日关键词搜索量
    const yestoday_search_keyword = total - last_day_count

    return {
      total,
      average: average.toFixed(3),
      count_total_day: yestoday_total == 0 ? 0 : ( yestoday_search_total / yestoday_total).toFixed(3),
      count_average_day: yestoday_search_keyword == 0 ? 0 : ( yestoday_total / yestoday_search_keyword ).toFixed(3),
      total_chart,
      average_chart,
      data: search_list
    }

  })
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data,
    needCache: false
  })

})
//搜索种类电影热度占比(分类 日期)
.get('/type', async(ctx) => {

  const { start_date, end_date } = getDateParams(ctx)

  const data = await Promise.all([
    MovieModel.aggregate([
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
          _id: 0,
          classify: "$info.classify",
        }
      },
      {
        $unwind: "$classify"
      },
      {
        $group: {
          _id: "$classify",
          total: {
            $sum: 1
          }
        }
      }
    ]),
    MovieModel.aggregate([
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
          classify: "$info.classify",
        }
      },
      {
        //联表查询
        $lookup: {
          from: 'classifies',
          localField: 'classify',
          foreignField: '_id',
          as: 'classify'
        }
      },
      {
        $unwind: "$classify"
      },
      {
        $project: {
          createdAt: 1,
          "classify._id": 1,
          "classify.name": 1,
        }
      },
      {
        $group: {
          _id: "$classify",
          count: {
            $sum: 1
          },
        }
      },
      {
        $sort: {
          count: -1
        }
      },
      {
        $limit: 15
      },
      {
        $project: {
          _id: 0,
          classify: "$_id",
          count: 1
        }
      }
    ])
  ])
  .then(([total_count, classify_count]) => {
    if(!Array.isArray(total_count) || !Array.isArray(classify_count)) return Promise.reject({ errMsg: 'data error', status: 404 })

    const total = total_count.length ? total_count[0].total : 0

    let count = 0

    const classifyData = classify_count.map(item => {
      const { count:_count, ...nextItem } = item

      let precent = 0
      if(total != 0) {
        precent = (_count / total).toFixed(3)
      }

      count += _count

      return {
        ...nextItem,
        count: precent
      }
    })

    // {
    //   data: {
    //     total,
    //     data: [
    //       {
    //         classify: {
    //           name,
    //           _id
    //         }
    //         count
    //       }
    //     ]
    //   }
    // }

    return {
      data: {
        total,
        data: [
          ...classifyData,
          {
            classify: {
              name: '其他',
              _id: null
            },
            count: total == 0 ? 0 : (count / total).toFixed(3)
          }
        ]
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

module.exports = router