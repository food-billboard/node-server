const Router = require('@koa/router')
const { CommentModel, dealErr, notFound, Params } = require('@src/utils')
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

router.get('/', async (ctx) => {
  Params.query(ctx, {
    name: "_id",
    type: ['isMongoId']
  })

  const { currPage=0, pageSize=30, _id } = ctx.query
  let res 
  const data = await CommentModel.findOne({
    _id: ObjectId(_id)
  })
  .select({
    source: 0,
    like_person: 0,
  })
  .populate({
    path: 'sub_comments',
    select: {
      sub_comments: 0,
      source: 0,
      like_person: 0
    },
    options: {
      limit: pageSize,
      skip: pageSize * currPage
    },
    populate: { 
      path: 'comment_users',
      select: {
        avatar: 1,
      }
    }
  })
  .exec()
  .then(data => !!data && data._doc)
  .then(notFound)
  .then(data => {
    const { sub_comments, comment_users, content: { image, video, ...nextContent }, user_info: { _doc: { avatar: { src }, ...nextUserInfo } }, ...nextComment } = data
    return {
      sub: [...sub_comments.map(sub => {
        const { _doc: { comment_users, content: { image, video, ...nextContent }, user_info: { _doc: { avatar: { src }, ...nextInfo } }, ...nextSub } } = sub
        return {
          ...nextSub,
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
            video: image.filter(v => !!v.src).map(v => v.src),
          },
          user_info: {
            ...nextInfo,
            avatar: src
          }
        }
      })],
      comment: {
        ...nextComment,
        content: {
          ...nextContent,
          image: image.filter(i => !!i.src).map(i => i.src),
          video: image.filter(v => !!v.src).map(v => v.src),
        },
        user_info: {
          ...nextUserInfo,
          avatar: src
        },
        comment_users: comment_users.length
      }
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