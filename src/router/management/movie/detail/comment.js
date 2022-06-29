const Router = require('@koa/router')
const { isNill } = require("lodash")
const { MovieModel, CommentModel, dealErr, notFound, responseDataDeal, Params, verifyTokenToData, COMMENT_SOURCE_TYPE } = require('@src/utils')
const { Types: { ObjectId }, Aggregate } = require('mongoose')
const Day = require('dayjs')
const { UserModel } = require('../../../../utils/mongodb/mongo.lib')

const router = new Router()

function findTargetModal(type, id) {
  if(type === COMMENT_SOURCE_TYPE.movie) {
    return MovieModel.findOne({
      _id: ObjectId(id)
    })
    .select({ _id: 1 })
    .exec()
    .then(notFound)
  }else {
    return CommentModel.findOne({
      _id: ObjectId(id)
    })
    .select({ _id: 1 })
    .exec()
    .then(notFound)
  }
}

function updateTargetModal(type, commentId, movieId, userId) {
  const action = [
    UserModel.updateOne({
      _id: userId
    }, {
      $push: { comment: commentId }
    })
  ]
  if(type === COMMENT_SOURCE_TYPE.movie) {
    return Promise.all([
      ...action,
      MovieModel.updateOne({
        _id: movieId
      }, {
        $push: { comment: commentId }
      })
    ])
  }else {
    return Promise.all([
      ...action,
      CommentModel.updateOne({
        _id: movieId
      }, {
        $push: { sub_comments: commentId }
      })
    ])
  }
}

const TEMPLATE_COMMENT = {
	sub_comments: [],
  like_person: [],
  content: {
    text: '',
    video: [],
    image: []
  },
  comment_users: []
}

router
//电影评论列表 时间 分页 排序（hot 时间 评论数量 点赞人数）
.get('/', async(ctx) => {

  const [ currPage, pageSize, _id, start_date, end_date, hot, time, comment ] = Params.sanitizers(ctx.query, {
    name: 'currPage',
    _default: 0,
    sanitizers: [
      data => parseInt(data),
      data => data >= 0 ? +data : 0
    ]
  }, {
    name: 'pageSize',
    _default: 30,
    sanitizers: [
      data => parseInt(data),
      data => data >= 0 ? +data : 30
    ]
  }, {
    name: '_id',
    sanitizers: [
      data => ObjectId(data)
    ]
  }, {
    name: 'start_date',
    sanitizers: [
      data => ((typeof data === 'string' && (new Date(data)).toString() == 'Invalid Date') || typeof data === 'undefined') ? undefined : Day(data).toDate()
    ]
  }, {
    name: 'end_date',
    sanitizers: [
      data => ((typeof data === 'string' && (new Date(data)).toString() == 'Invalid Date') || typeof data === 'undefined') ? Day().toDate() : Day(data).toDate()
    ]
  }, {
    name: 'hot',
    sanitizers: [
      data => parseInt(data),
      data => Number.isNaN(data) ? -1 : data > 0 ? 1 : -1
    ]
  }, {
    name: 'time',
    sanitizers: [
      data => parseInt(data),
      data => Number.isNaN(data) ? -1 : data > 0 ? 1 : -1
    ]
  }, {
    name: 'comment',
    sanitizers: [
      data => parseInt(data),
      data => Number.isNaN(data) ? -1 : data > 0 ? 1 : -1
    ]
  })

  const aggregate = new Aggregate()
  aggregate.model(MovieModel)

  const data = await Promise.all([
    CommentModel.aggregate([
      {
        $match: {
          source: _id
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
    CommentModel.aggregate([
      {
        $match: {
          source_type: 'movie',
          source: _id,
          // createdAt: {
          //   $lte: end_date,
          //   ...(!!start_date ? { $gte: start_date } : {})
          // }
        }
      },
      {
        $project: {
          user_info: 1,
          total_like: 1,
          createdAt: 1,
          updatedAt: 1,
          source_type: 1,
          source: 1,
          content: 1,
          comment_users: {
            $size: {
              $ifNull: [
                "$comment_users",
                []
              ]
            }
          },
          comment_count: {
            $size: {
              $ifNull: [
                "$sub_comments",
                []
              ]
            }
          }
        }
      },
      {
        $sort: {
          total_like: hot,
          createdAt: time,
          comment_count: comment,
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
          from: "users",
          let: {
            userId: "$user_info"
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [
                    "$_id", "$$userId"
                  ]
                }
              }
            },
            {
              $lookup: {
                from: 'images',
                localField: 'avatar',
                foreignField: '_id',
                as: 'avatar'
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
                username: 1,
                avatar: "$avatar.src",
                _id: 1,
                description: 1
              }
            }
          ],
          as: "user_info"
        }
      },
      {
        $unwind: "$user_info"
      },
      {
        $lookup: {
          from: 'images', 
          localField: 'content.image', 
          foreignField: '_id', 
          as: 'image'
        }
      },
      {
        $lookup: {
          from: 'videos', 
          localField: 'content.video', 
          foreignField: '_id', 
          as: 'video'
        }
      },
      {
        $project: {
          _id: 1,
          user_info: {
            _id: "$user_info._id",
            username: "$user_info.username",
            description: "$user_info.description",
            avatar: "$user_info.avatar"
          },
          comment_count: 1,
          total_like: 1,
          source_type: 1,
          comment_users: 1,
          source: 1,
          content: {
            text: "$content.text",
            video: "$video.src",
            image: "$image.src",
          },
          createdAt: 1,
          updatedAt: 1
        }
      }
    ])
  ])
  .then(([total_count, comment_data]) => {
    if(!Array.isArray(total_count) || !Array.isArray(comment_data)) return Promise.reject({ errMsg: 'not found', status: 404 })
    return {
      data: {
        total: !!total_count.length ? total_count[0].total || 0 : 0,
        list: comment_data
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
.post('/', async (ctx) => {

  const check = Params.body(ctx, {
    name: 'source_type',
    validator: [
      data => Object.values(COMMENT_SOURCE_TYPE).includes(data)
    ]
  }, {
    name: '_id',
    validator: [
      data => ObjectId.isValid(data)
    ]
  })

  if(check) return

  const { body: { content: {
    text='',
  }, source_type } } = ctx.request
  const [ _id, image, video ] = Params.sanitizers(ctx.request.body, {
    name: '_id',
    sanitizers: [
      data => ObjectId(data)
    ]
  },
  {
    name: 'content.image',
    sanitizers: [
      data => data ? data.map(d => ObjectId(d)) : []
    ]
  },
  {
    name: 'content.video',
    sanitizers: [
      data => data ? data.map(d => ObjectId(d)) : []
    ]
  })
  const [, token] = verifyTokenToData(ctx)
  const { id } = token

  const data = await findTargetModal(source_type, _id)
  .then(_ => {
    const comment = new CommentModel({
      ...TEMPLATE_COMMENT,
      source_type,
      source: _id,
      user_info: ObjectId(id),
      content: {
        text,
        video,
        image
      }
    })
    return comment.save()
  })
  .then(data => {
    const { _id: commentId, user_info, source } = data
    return updateTargetModal(source_type, commentId, source, user_info)
    .then(_ => data)
  })
  .then(data => {
    return {
      data: data._id 
    }
  })
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data,
    needCache: false
  })

})
.delete("/", async (ctx) => {
  const check = Params.query(ctx, {
    name: '_id',
    validator: [
      data => data.split(",").every(item => ObjectId.isValid(item.trim()))
    ]
  })

  if(check) return

  const [ _id ] = Params.sanitizers(ctx.query, {
    name: '_id',
    sanitizers: [
      data => data.split(",").map(item => ObjectId(item.trim()))
    ]
  })

  const [, token] = verifyTokenToData(ctx)
  const { id } = token

  const data = await CommentModel.aggregate([
    {
      $match: {
        _id: {
          $in: _id
        }
      }
    },
    {
      $project: {
        _id: 1,
        sub_comments: 1,
        source_type: 1,
        source: 1,
        user_info: 1
      }
    }
  ])
  .then(data => {
    return Promise.all([
      UserModel.updateMany({
        _id: {
          $in: data.map(item => item.user_info).filter(item => ObjectId.isValid(item))
        }
      }, {
        $pull: {
          comment: {
            $in: _id
          } 
        }
      }),
      MovieModel.updateMany({
        _id: {
          $in: data.filter(item => item.source_type === COMMENT_SOURCE_TYPE.movie && ObjectId.isValid(item.source)).map(item => item.source)
        }
      }, {
        $pull: {
          comment: {
            $in: _id
          } 
        }
      }),
      CommentModel.updateMany({
        sub_comments: {
          $in: data.filter(item => item.source_type === COMMENT_SOURCE_TYPE.comment && ObjectId.isValid(item._id)).map(item => item._id)
        }
      }, {
        $pull: {
          sub_comments: {
            $in: _id
          } 
        }
      }),
      CommentModel.deleteMany({
        _id: {
          $in: [
            ..._id,
            ...data.reduce((acc, cur) => {
              const { sub_comments } = cur 
              sub_comments.forEach(item => {
                if(!_id.every(remoteId => remoteId.equals(item))) acc.push(item)
              })
              return acc 
            }, [])
          ] 
        }
      })
    ])
  })
  .then(data => {
    return {
      data: _id 
    }
  })
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data,
    needCache: false
  })
})
.get("/detail", async (ctx) => {

  const [ currPage, pageSize, _id, start_date, end_date, hot, time, comment ] = Params.sanitizers(ctx.query, {
    name: 'currPage',
    _default: 0,
    sanitizers: [
      data => parseInt(data),
      data => data >= 0 ? +data : 0
    ]
  }, {
    name: 'pageSize',
    _default: 30,
    sanitizers: [
      data => parseInt(data),
      data => data >= 0 ? +data : 30
    ]
  }, {
    name: '_id',
    sanitizers: [
      data => ObjectId(data)
    ]
  }, {
    name: 'start_date',
    sanitizers: [
      data => ((typeof data === 'string' && (new Date(data)).toString() == 'Invalid Date') || typeof data === 'undefined') ? undefined : Day(data).toDate()
    ]
  }, {
    name: 'end_date',
    sanitizers: [
      data => ((typeof data === 'string' && (new Date(data)).toString() == 'Invalid Date') || typeof data === 'undefined') ? Day().toDate() : Day(data).toDate()
    ]
  }, {
    name: 'hot',
    sanitizers: [
      data => isNill(data) ? 0 : data > 0 ? 1 : -1
    ]
  }, {
    name: 'time',
    sanitizers: [
      data => isNill(data) ? 0 : data > 0 ? 1 : -1
    ]
  }, {
    name: 'comment',
    sanitizers: [
      data =>isNill(data) ? 0 : data > 0 ? 1 : -1
    ]
  })

  const commentMatch = {
    $expr: {
      $eq: [
        "$source", "$$parentId"
      ]
    },
  }

  const commentSort = {}

  if(hot) commentSort.total_like = +hot 
  if(time) commentSort.createdAt = +time
  if(comment) commentSort.comment_users = +comment 

  if(start_date || end_date) {
    commentMatch.createdAt = {}
    if(start_date) commentMatch.createdAt.$gte = start_date 
    if(end_date) commentMatch.createdAt.$lte = end_date 
  }

  const data = await CommentModel.aggregate([
    {
      $match: {
        _id,
      }
    },
    {
      $lookup: {
        from: "comments",
        let: {
          parentId: "$_id"
        },
        pipeline: [
          {
            $match: commentMatch
          },
          {
            $lookup: {
              from: "users",
              let: {
                userId: "$user_info"
              },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $eq: [
                        "$_id", "$$userId"
                      ]
                    }
                  }
                },
                {
                  $lookup: {
                    from: 'images',
                    localField: 'avatar',
                    foreignField: '_id',
                    as: 'avatar'
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
                    username: 1,
                    avatar: "$avatar.src",
                    _id: 1,
                    description: 1
                  }
                }
              ],
              as: "user_info"
            }
          },
          {
            $unwind: "$user_info"
          },
          {
            $lookup: {
              from: 'images',
              localField: 'content.image',
              foreignField: '_id',
              as: 'content.image'
            }
          },
          {
            $lookup: {
              from: 'videos',
              localField: 'content.video',
              foreignField: '_id',
              as: 'content.video'
            }
          },
          {
            $project: {
              _id: 1,
              user_info: "$user_info",
              total_like: 1,
              source_type: 1,
              source: 1,
              comment_users: {
                $size: {
                  $ifNull: [
                    "$comment_users", []
                  ]
                }
              },
              comment_count: {
                $size: {
                  $ifNull: [
                    "$sub_comments", []
                  ]
                }
              },
              content: {
                text: "$content.text",
                image: "$content.image.src",
                video: "$content.video.src"
              },
              createdAt: 1,
              updatedAt: 1
            }
          },
          ...(Object.values(commentSort).length ? [{
            $sort: commentSort
          }] : []) 
        ],
        as: "comment" 
      }
    },
    {
      $project: {
        comment: {
          $slice: [ "$comment", pageSize * currPage, pageSize ]
        },
        total: {
          $size: {
            $ifNull: [
              "$sub_comments",
              []
            ]
          }
        }
      }
    },
  ])
  .then((data) => {
    const [ target ] = data 
    if(!target) return Promise.reject({ errMsg: 'not found', status: 404 })
    return {
      data: {
        total: target.total,
        list: target.comment 
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