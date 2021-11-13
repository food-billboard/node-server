const Router = require('@koa/router')
const { verifyTokenToData, UserModel, dealErr, notFound, Params, responseDataDeal, avatarGet, COMMENT_SOURCE_TYPE, CommentModel, MovieModel } = require('@src/utils')
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

function getSourceContent(contnet) {
  if(typeof content === 'string') return contnet 
  const { text } = contnet || {}
  return text || ''
}

router
.get('/', async (ctx) => {
  const [, token] = verifyTokenToData(ctx)
  const { id } = token

  const [ currPage, pageSize ] = Params.sanitizers(ctx.query, {
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

  const data = await UserModel.findOne({
    _id: ObjectId(id)
  })
  .select({
    comment: 1,
    avatar: 1,
    username: 1,
    _id: 1
  })
  .populate({
    path: 'comment',
    options: {
      ...(pageSize >= 0 ? { limit: pageSize } : {}),
      ...((currPage >= 0 && pageSize >= 0) ? { skip: pageSize * currPage } : {})
    },
    select: {
      source: 1,
      updatedAt: 1,
      createdAt: 1,
      total_like: 1,
      content: 1,
      like_person: 1,
      comment_users: 1,
      source_type: 1,
    },
    populate: {
      path: 'source',
      select: {
        name: 1,
        content: 1,
      }
    },
  })
  .exec()
  .then(notFound)
  .then(data => {
    const { comment, _id: userId, avatar, ...nextData } = data
    let like = false
    return {
      data: {
        comment: comment.map(c => {
          like = false
          const { 
            like_person, 
            content: { image, video, ...nextContent }, 
            source={}, 
            source_type,
            comment_users,
            ...nextC 
          } = c

          const { name, content, ...nextSoruce } = source || {}
          if(like_person.some(l => l.equals(userId))) {
            like = true
          }
          return {
            ...nextC,
            comment_users: comment_users.length,
            content: {
              ...nextContent,
              image: image.filter(i => i && !!i.src).map(i => i.src),
              video: video.filter(v => v && !!v.src).map(v => {
                const { src, poster } = v
                return {
                  src,
                  poster: avatarGet(poster)
                }
              })
            },
            source: {
              ...nextSoruce,
              type: source_type,
              content: name ? name : getSourceContent(content)
            },
            like,
            user_info: {
              ...nextData,
              _id: userId,
              avatar: avatar ? avatar.src : null,
            }
          }
        })
      }
    }
  })
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data
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
          $in: _id,
        },
        user_info: ObjectId(id)
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
      UserModel.updateOne({
        _id: ObjectId(id)
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
  .then(() => {
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

module.exports = router