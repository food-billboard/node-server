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
        $unwind: "$glance"
      },
      {
        $skip: currPage * pageSize
      },
      {
        $limit: pageSize
      },
      {
        $addFields: {
          "glance_id": "$glance._id"
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
            movie_id: "$glance_id" 
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
          as: 'glance_data',
        }
      },
      {
        $unwind: "$glance_data"
      },
      {
        $addFields: {
          store: {
            $cond: [
              {
                $in: [
                  "$glance_id", data.store.map(item => item._id)
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
          description: "$glance_data.description",
          name: "$glance_data.name",
          poster: "$glance_data.poster",
          _id: "$glance_data._id",
          rate: "$glance_data.rate",
          classify: "$glance_data.classify",
          publish_time: "$glance_data.publish_time",
          hot: "$glance_data.hot",
          author: "$glance_data.author",
          images: "$glance_data.images"
        }
      }
    ])
  })
  .then(data => {
    return {
      data: {
        glance: data 
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