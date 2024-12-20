const Router = require('@koa/router')
const { verifyTokenToData, UserModel, dealErr, Params, responseDataDeal, notFound, commonAggregateMovie } = require("@src/utils")
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

router
.get('/', async(ctx) => {

  const check = Params.query(ctx, {
    name: "_id",
    validator: [
      data => ObjectId.isValid(data)
    ]
  })

  if(check) return 

  const [ currPage, pageSize, _id ] = Params.sanitizers(ctx.query, {
    name: 'currPage',
    _default: 0,
    type: ['toInt'],
    sanitizers: [
      data => data >= 0 ? data : -1
    ]
  }, {
    name: 'pageSize',
    _default: 30,
    type: ['toInt'],
    sanitizers: [
      data => data >= 0 ? data : -1
    ]
  }, {
    name: "_id",
    sanitizers: [
      data => ObjectId(data)
    ]
  })

  const [, token] = verifyTokenToData(ctx)
  const { id } = token

  const data = await UserModel.findOne({
    _id: ObjectId(id)
  })
  .select({
    store: 1
  })
  .exec()
  .then(notFound)
  .then(data => {
    return UserModel.aggregate([
      {
        $match: {
          _id
        }
      },
      {
        $unwind: "$issue"
      },
      {
        $skip: currPage * pageSize
      },
      {
        $limit: pageSize
      },
      {
        $addFields: {
          "issue_id": "$issue._id"
        }
      },
      {
        $addFields: {
          "store_list": "$store._id"
        }
      },
      {
        $lookup: {
          from: 'movies', 
          let: { 
            movie_id: "$issue_id" 
          },
          pipeline: [  
            {
              $match: {
                $expr: {
                  "$eq": [ "$_id", "$$movie_id" ]
                },
              }
            },
            ...commonAggregateMovie
          ],
          as: 'issue_data',
        }
      },
      {
        $unwind: "$issue_data"
      },
      {
        $addFields: {
          store: {
            $cond: [
              {
                $in: [
                  "$issue_id", data.store.map(item => item._id)
                ]
              },
              true,
              false 
            ]
          }
        }
      },
      {
        $project: {
          store: "$store",
          description: "$issue_data.description",
          name: "$issue_data.name",
          poster: "$issue_data.poster",
          _id: "$issue_data._id",
          rate: "$issue_data.rate",
          classify: "$issue_data.classify",
          publish_time: "$issue_data.publish_time",
          hot: "$issue_data.hot",
          author: "$issue_data.author",
          images: "$issue_data.images"
        }
      }
    ])
  })
  .then(data => {
    return {
      data: {
        issue: data 
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