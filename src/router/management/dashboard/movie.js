const Router = require('@koa/router')
const { MovieModel, SearchModel, UserModel, dealErr, responseDataDeal } = require('@src/utils')
const { getDateParams } = require('@src/router/management/utils')

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

  const { date_type, start_date, end_date, group, sort, templateList } = getDateParams(ctx)

  const [ currPage, pageSize ] = Params.sanitizers(ctx.query, {
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
    //用户总数
    UserModel.aggregate([
      {
        $group: {
          _id: null,
          user_total: {
            $sum: 1
          }
        }
      }
    ]),
    SearchModel.aggregate([

    ]),
    //数据统计
    SearchModel.aggregate([
      {
        $unwind: "hot"
      },
      {
        $match: {
          hot: {
            ...(!!start_date ? { $gte: start_date } : {}),
            $lte: end_date
          }
        }
      },
      {
        $project: {
          key_word: 1,
          hot: 1
        },
      },
      {
        $group: {

        }
      },
      {
        $sort: {

        }
      },
      // {
      //   $skip: currPage * pageSize
      // },
      // {
      //   limit: pageSize
      // },

    ])
  ])
  .then(([ key_word_total, user_total, search_data ]) => {

    const user_count = user_total.length ? user_total.total || 0 : 0
    const { total=0, search_total=0 } = key_word_total.length ? key_word_total[0] : {}

    return {
      total,
      average: (search_total / (user_count == 0 ? 1 : user_count)).toFixed(3)
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
        limit: 15
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