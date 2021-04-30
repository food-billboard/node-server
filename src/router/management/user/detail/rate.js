const Router = require('@koa/router')
const { UserModel, dealErr, Params, responseDataDeal } = require('@src/utils')
const { Types: { ObjectId } } = require('mongoose')
const Day = require('dayjs')

const router = new Router()

router
//电影评分列表
.get('/', async(ctx) => {

  const check = Params.query(ctx, {
    name: '_id',
    validator: [
      data => ObjectId.isValid(data)
    ]
  })

  if(check) return 

  const [ currPage, pageSize, _id, end_date, start_date, value ] = Params.sanitizers(ctx.query, {
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
    name: '_id',
    sanitizers: [
      data => ObjectId(data)
    ]
  }, {
    name: 'end_date',
    sanitizers: [
      data => ((typeof data === 'string' && (new Date(data)).toString() == 'Invalid Date') || typeof data === 'undefined') ? Day().toDate() : Day(data).toDate()
    ]
  }, {
    name: 'start_date',
    sanitizers: [
      data => ((typeof data === 'string' && (new Date(data)).toString() == 'Invalid Date') || typeof data === 'undefined') ? undefined : Day().toDate()
    ]
  }, {
    name: 'value',
    sanitizers: [
      data => parseInt(data),
      data => Number.isNaN(data) ? new Array(11).fill(0).map((_, index) => index) : [ data ]
    ]
  })

  const data = await Promise.all([
    UserModel.aggregate([
      {
        $match: {
          _id
        }
      },
      {
        $unwind: "$rate"
      },
      {
        $match: {
          "rate.timestamps": {
            $lte: end_date.getTime(),
            ...(!!start_date ? { $gte: start_date.getTime() } : {})
          },
          "rate.rate": { $in: value }
        }
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: 1
          }
        }
      }
    ]),
    UserModel.aggregate([
      {
        $match: {
          _id
        }
      },
      {
        $unwind: "$rate"
      },
      {
        $match: {
          "rate.timestamps": {
            $lte: end_date.getTime(),
            ...(!!start_date ? { $gte: start_date.getTime() } : {})
          },
          "rate.rate": { $in: value }
        }
      },
      {
        $skip: currPage * pageSize,
      },
      {
        $limit: pageSize
      },
      {
        $lookup: {
          from: 'movies', 
          localField: 'rate._id', 
          foreignField: '_id', 
          as: 'movie'
        }
      },
      {
        $unwind: "$movie"
      },
      {
        $project: {
          value: "$rate.rate",
          createdAt: "$rate.timestamps",
          _id: "$movie._id",
          name: "$movie.name",
          author_rate: "$movie.author_rate",
          rate_person: "$movie.rate_person",
          total_rate: "$movie.total_rate",
          source_type: "$movie.source_type",
        }
      }
    ]),
  ])
  .then(([total_count, rate_data]) => {

    if(!Array.isArray(total_count) || !Array.isArray(rate_data)) return Promise.reject({ errMsg: 'data error', status: 404 })

    return {
      data: {
        total: !!total_count.length ? total_count[0].total || 0 : 0,
        list: rate_data
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