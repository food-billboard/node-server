const Router = require('@koa/router')
const { dealErr, UserModel, notFound, Params, responseDataDeal } = require('@src/utils')
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

router
.get('/', async (ctx) => {

  const check = Params.query(ctx,
    {
      name: "_id",
      validator: [
        data => ObjectId.isValid(data)
      ]
    }
  )
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
    name: '_id',
    sanitizers: [
      function(data) {
        return ObjectId(data)
      }
    ]
  })

  //查找评论id
  const data = await UserModel.findOne({
    _id
  })
  .select({
    comment: 1,
    avatar: 1,
    username: 1,
    _id: 1
  })
  .populate({
    path: 'comment',
    select: {
      source_type: 1,
      source: 1,
      createdAt: 1,
      total_like: 1,
      content: 1,
    },
    options: {
      ...(pageSize >= 0 ? { limit: pageSize } : {}),
      ...((currPage >= 0 && pageSize >= 0) ? { skip: pageSize * currPage } : {})
    },
    populate: {
      path: 'source',
      select: {
        name: 1,
        content: 1
      }
    },
  })
  .exec()
  .then(notFound)
  .then(data => {
    const { comment, avatar, ...nextData } = data
    return {
      data: {
        user_info: {
          ...nextData,
          avatar: avatar ? avatar.src : null
        },
        data: comment.map(c => {
          const { content: { image, video, ...nextContent }, source_type, source={}, ...nextC } = c
          const { name, content, ...nextSource } = source || {}
          return {
            ...nextC,
            source: {
              ...nextSource,
              type: source_type,
              content: name ? name : ( content || null )
            },
            content: {
              ...nextContent,
              image: image.filter(i => !!i.src).map(i => i.src),
              video: video.filter(v => !!v.src).map(v => v.src)
            },
            like: false
          }
        })
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