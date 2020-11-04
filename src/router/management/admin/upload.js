const Router = require('@koa/router')
const { UserModel, notFound, dealErr, responseDataDeal, verifyTokenToData, Params } = require('@src/utils')

const router = new Router()

router
//上传列表
.get('/', async(ctx) => {

  const [, token] = verifyTokenToData(ctx)
  const { mobile } = token

  const [ currPage, pageSize ] = Params.sanitizers(ctx.query, {
    name: 'currPage',
    type: ['toInt'],
    _default: 0,
    sanitizers: [
      data => data >= 0 ? data : -1
    ]
  }, {
    name: 'pageSize',
    type: ['toInt'],
    _default: 30,
    sanitizers: [
      data => data >= 0 ? data : -1
    ]
  })

  const data = await UserModel.findOne({
    mobile: Number(mobile)
  })
  .select({
    _id: 1,
  })
  .exec()
  .then(data => !!data && data._doc)
  .then(notFound)
  .then(data => {
    const { _id } = data
    return Promise.all([
      MovieModel.aggregate([
        {
          $match: {
            author: _id,
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
      MovieModel.aggregate([
        {
          $match: {
            author: _id,
          }
        },
        {
          $skip: currPage * pageSize
        },
        {
          $limit: pageSize
        },
        {
          $project: {
            name: 1,
            glance: 1,
            hot: 1,
            rate_person: 1,
            total_rate: 1,
            status: 1,
            createdAt: 1,
            updatedAt: 1,
            barrage_count: {
              $size: {
                $ifNull: [
                  "$barrage", []
                ]
              }
            },
            tag_count: {
              $size: {
                $ifNull: [
                  "$tag", []
                ]
              }
            },
            comment_count: {
              $size: {
                $ifNull: [
                  "$comment", []
                ]
              }
            },
          }
        }
      ])
    ]) 
  })
  .then(([ total_count, issue_data ]) => {

    if(!Array.isArray(total_count) || !Array.isArray(issue_data)) return Promise.reject({ errMsg: 'data error', status: 404 })

    return {
      // {
      //   data: {
      //     total,
      //     list: [{
      //       _id,
      //       name,
      //       glance,
      //       hot,
      //       rate_person,
      //       total_rate,
      //       status,
      //       barrage_count,
      //       tag_count,
      //       comment_count,
      //       createdAt,
      //       updatedAt,
      //     }]
      //   }
      // }
      data: {
        total: !!total_count.length ? total_count[0].total || 0 : 0,
        list: issue_data
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