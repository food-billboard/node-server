const Router = require('@koa/router')
const { dealErr, UserModel, notFound, Params } = require('@src/utils')
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

router
.get('/', async (ctx) => {
  const check = Params.query(ctx,
    {
      name: "_id",
      type: ['isMongoId']
    }
  )
  if(check) {
    ctx.body = JSON.stringify({
      ...check.res
    })
    return
  }

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
  let res
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
  .then(data => !!data && data._doc)
  .then(notFound)
  .then(data => {
    const { comment, avatar, ...nextData } = data
    return {
      user_info: {
        ...nextData,
        avatar: avatar ? avatar.src : null
      },
      data: comment.map(c => {
        const { _doc: { content: { image, video, ...nextContent }, source_type, source={}, ...nextC } } = c
        const { _doc: { name, content, ...nextSource }={} } = source
        return {
          ...nextC,
          source: {
            ...nextSource,
            type: source_type,
            content: name ? name : ( content ? content: null )
          },
          content: {
            ...nextContent,
            image: image.filter(i => !!i.src).map(i => i.src),
            video: video.filter(v => !!v.src).map(v => v.src)
          }
        }
      })
    }
  })
  .catch(dealErr(ctx))

  if(data && data.err) {
    res = {
      ...data.res
    }
  }else {
    res = {
      success: true,
      res: {
        data
      }
    }
  }

  ctx.body = JSON.stringify(res)

})

module.exports = router