const Router = require('@koa/router')
const { dealErr, UserModel, notFound, Params } = require('@src/utils')
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

router
.get('/', async (ctx) => {
  Params.query(ctx, [
    {
      name: "_id",
      type: ['isMongoId']
    }
  ])

  const { currPage=0, pageSize=30, _id } = ctx.query

  let res
  //查找评论id
  const data = await UserModel.findOne({
    _id: ObjectId(_id)
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
      limit: pageSize,
      skip: currPage * pageSize
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
    const { comment, avatar: { src }, ...nextData } = data
    return {
      user_info: {
        ...nextData,
        avatar: src
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