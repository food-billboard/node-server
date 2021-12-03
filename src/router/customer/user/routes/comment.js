const Router = require('@koa/router')
const { verifyTokenToData, dealErr, responseDataDeal, Params, CommentModel } = require('@src/utils')
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

router
.get('/', async (ctx) => {
  const [, token] = verifyTokenToData(ctx)
  const { id } = token
  const check = Params.query(ctx, {
    name: '_id',
    validator: [
			data => ObjectId.isValid(data)
		]
  })
  if(check) return

  const [ _id, currPage, pageSize ] = Params.sanitizers(ctx.query, {
    name: '_id',
    sanitizers: [
      data => ObjectId(data)
    ]
  }, {
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
  })

  const data = await CommentModel.aggregate([
    {
      $match: {
        user_info: _id
      }
    },
    {
      $skip: currPage * pageSize
    },
    {
      $limit: pageSize
    },
    {
      $lookup: {
        from: 'movies',
        as: 'source_movie',
        foreignField: "_id",
        localField: "source"
      }
    }, 
    {
      $unwind: {
        path: "$source_movie",
        preserveNullAndEmptyArrays: true 
      }
    }, 
    {
      $lookup: {
        from: 'comments',
        as: 'source_comment',
        foreignField: "_id",
        localField: "source"
      }
    }, 
    {
      $unwind: {
        path: "$source_comment",
        preserveNullAndEmptyArrays: true 
      }
    }, 
    {
      $lookup: {
        from: 'users',
        let: { 
          user_id: "$user_info"
        },
        pipeline: [
          {
            $match: {
              $expr: {
                "$eq": [ "$_id", "$$user_id" ]
              },
            }
          },
          {
            $lookup: {
              from: 'images',
              as: 'avatar',
              foreignField: "_id",
              localField: "avatar"
            }
          },
          {
            $unwind: {
              path: "$avatar",
              preserveNullAndEmptyArrays: true 
            }
          },
          {
            $project: {
              _id: 1,
              avatar: "$avatar.src",
              username: 1
            }
          }
        ],
        as: 'user_info'
      }
    }, 
    {
      $unwind: {
        path: "$user_info",
        preserveNullAndEmptyArrays: true 
      }
    },
    {
      $lookup: {
        from: 'videos',
        as: 'content.video',
        let: {
          video_ids: "$content.video"
        },
        pipeline: [
          { 
            $match: {
              $expr: {
                "$in": [ "$_id", "$$video_ids" ]
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
            $project: {
              src: 1,
              poster: '$poster.src'
            }
          }
        ],
      }
    }, 
    {
      $lookup: {
        from: 'images',
        as: 'content.image',
        foreignField: "_id",
        localField: "content.image"
      }
    },
    {
      $addFields: {
        like: {
          $cond: [
            {
              $in: [
                ObjectId(id), "$like_person"
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
        content: {
          text: "$content.text",
          image: "$content.image.src",
          video: "$content.video",
        },
        createdAt: 1,
        updatedAt: 1,
        like: "$like",
        total_like: 1,
        _id: 1,
        user_info: "$user_info",
        source: {
          _id: "$source",
          type: "$source_type",
          content: {
            $ifNull: [
              "$source_movie.name",
              "$source_comment.content.text"
            ]
          }
        }
      }
    }
  ])
  .then(data => {
    return {
      data: {
        comment: data 
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