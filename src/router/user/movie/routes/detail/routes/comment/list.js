const Router = require('@koa/router')
const { MovieModel, dealErr, notFound, Params } = require('@src/utils')
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

router.get('/', async (ctx) => {
  Params.query(ctx, {
    name: "_id",
    type: ['isMongoId']
  })

  const { currPage=0, pageSize=30, _id } = ctx.query
  let res
  const data = await MovieModel.findOne({
    _id: ObjectId(_id)
  })
  .select({
    comment: 1,
    _id: 0
  })
  .populate({
    path: 'comment',
    select: {
      sub_comments: 0,
      source: 0,
      like_person: 0,
      _id: 0
    },
    options: {
      limit: pageSize,
      skip: pageSize * currPage,
    },
    populate: {
      path: 'comment_users',
      select: {
        avatar: 1,
        username: 1
      }
    },
  })
  .exec()
  .then(data => !!data && data._doc)
  .then(notFound)
  .then(data => {
    const { comment } = data
    return {
      comment: comment.map(c => {
        const { _doc: { comment_users, content: { image, video, ...nextContent }, user_info: { _doc: { avatar: { src }, ...nextInfo } }, ...nextC } } = c
        return {
          ...nextC,
          comment_users: comment_users.map(com => {
            const { _doc: { avatar: { src }, ...nextCom } } = com
            return {
              ...nextCom,
              avatar: src
            }
          }),
          content: {
            ...nextContent,
            image: image.filter(i => !!i.src).map(i => i.src),
            video: video.filter(v => !!v.src).map(v => v.src),
          },
          user_info: {
            ...nextInfo,
            avatar: src
          }
        }
      }),
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
  ctx.body = JSON.stringify({res})
})

module.exports = router