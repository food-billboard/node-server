const Router = require('@koa/router')
const { verifyTokenToData, UserModel, dealErr, Params, responseDataDeal, notFound } = require("@src/utils")
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
        $unwind: "$store"
      },
      {
        $skip: currPage * pageSize
      },
      {
        $limit: pageSize
      },
      {
        $addFields: {
          "store_id": "$store._id"
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
            movie_id: "$store_id" 
          },
          pipeline: [  
            {
              $match: {
                $expr: {
                  "$eq": [ "$_id", "$$movie_id" ]
                },
              }
            },
            {
              $lookup: {
                from: 'images',
                as: 'poster',
                foreignField: "_id",
                localField: "poster"
              }
            },
            {
              $unwind: {
                path: "$poster",
                preserveNullAndEmptyArrays: true 
              }
            },
            {
              $lookup: {
                from: 'classifies',
                as: 'info.classify',
                foreignField: "_id",
                localField: "info.classify"
              }
            },
            {
              $lookup: {
                from: 'users',
                as: 'author',
                foreignField: "_id",
                localField: "author"
              }
            },
            {
              $unwind: {
                path: "$author",
                preserveNullAndEmptyArrays: true 
              }
            },
            {
              $lookup: {
                from: 'images',
                as: 'author.avatar',
                foreignField: "_id",
                localField: "author.avatar"
              }
            },
            {
              $unwind: {
                path: "$author.avatar",
                preserveNullAndEmptyArrays: true 
              }
            },
            {
              $addFields: {
                cal_rate: {
                  $divide: [
                    "$total_rate",
                    "$rate_person"
                  ]
                }
              }
            },
            {
              $project: {
                description: "$info.description",
                name: 1,
                poster: "$poster.src",
                _id: 1,
                rate: {
                  $ifNull: [
                    "$cal_rate",
                    0
                  ]
                },
                classify: {
                  $map: {
                    input: "$info.classify",
                    as: "classify",
                    in: {
                      name: "$$classify.name"
                    }
                  }
                },
                publish_time: "$info.screen_time",
                hot: 1,
                author: {
                  username: "$author.username",
                  _id: "$author._id",
                  avatar: "$author.avatar.src",
                },
              }
            }
          ],
          as: 'store_data',
        }
      },
      {
        $unwind: "$store_data"
      },
      {
        $addFields: {
          store: {
            $cond: [
              {
                $in: [
                  "$store_id", data.store.map(item => item._id)
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
          description: "$store_data.description",
          name: "$store_data.name",
          poster: "$store_data.poster",
          _id: "$store_data._id",
          rate: "$store_data.rate",
          classify: "$store_data.classify",
          publish_time: "$store_data.publish_time",
          hot: "$store_data.hot",
          author: "$store_data.author",
        }
      }
    ])
  })
  .then(data => {
    return {
      data: {
        store: data 
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