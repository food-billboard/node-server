const Router = require('@koa/router')
const { verifyTokenToData, CommentModel, dealErr, Params, responseDataDeal } = require('@src/utils')
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

router
.get('/', async (ctx) => {
  const check = Params.query(ctx, {
    name: "_id",
    validator: [
			data => ObjectId.isValid(data)
		]
  })
  if(check) return

  const [ , token ] = verifyTokenToData(ctx)
  let { id } = token
  const [ currPage, pageSize, commentId ] = Params.sanitizers(ctx.query, {
		name: 'currPage',
		_default: 0,
    type: [ 'toInt' ],
    sanitizers: [
      data => data >= 0 ? data : 0
    ]
	}, {
		name: 'pageSize',
		_default: 30,
    type: [ 'toInt' ],
    sanitizers: [
      data => data >= 0 ? data : 30
    ]
	}, {
		name: '_id',
		sanitizers: [
			function(data) {
				return ObjectId(data)
			}
		]
  })

  const aggregate = [
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
        from: 'users',
        as: 'comment_users',
        let: {
          user_ids: "$comment_users"
        },
        pipeline: [
          { 
            $match: {
              $expr: {
                "$in": [ "$_id", "$$user_ids" ]
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
              username: 1,
              avatar: '$avatar.src'
            }
          }
        ],
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
  ]

  const project = {
    comment_users: "$comment_users",
    content: {
      text: "$content.text",
      image: "$content.image.src",
      video: "$content.video",
    },
    createdAt: "$createdAt",
    updatedAt: "$updatedAt",
    like: "$like",
    total_like: "$total_like",
    _id: "$_id",
    user_info: "$user_info"
  }

  const data = await CommentModel.aggregate([
    {
      $match: {
        _id: commentId
      }
    },
    ...aggregate, 
    {
      $lookup: {
        from: 'comments',
        let: { 
          comment_ids: "$sub_comments"
        },
        pipeline: [
          { 
            $match: {
              $expr: {
                "$in": [ "$_id", "$$comment_ids" ]
              },
            }
          },
          {
            $skip: currPage * pageSize
          },
          {
            $limit: pageSize
          },
          ...aggregate,
          {
            $project: project
          }
        ],
        as: "sub"
      }
    },
    {
      $project: {
        comment: project,
        sub: "$sub"
      }
    }
  ])
  .then(data => {
    const { comment, sub } = data[0] || {}
    return {
      data: {
        comment,
        sub
      }
    }
  })
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data
  })

})

module.exports = router