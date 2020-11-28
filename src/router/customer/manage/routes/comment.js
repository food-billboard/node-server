const Router = require('@koa/router')
const { verifyTokenToData, UserModel, dealErr, notFound, Params, responseDataDeal } = require('@src/utils')
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

router.get('/', async (ctx) => {
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
  .then(data => !!data && data._doc)
  .then(notFound)
  .then(data => {
    const { comment, _id: userId, avatar, ...nextData } = data
    let like = false
    return {
      data: {
        comment: comment.map(c => {
          like = false
          const { 
            _doc: { 
              like_person, 
              content: { image, video, ...nextContent }, 
              source={}, 
              source_type,
              comment_users,
              ...nextC 
            } 
          } = c

          const { _doc: { name, content, ...nextSoruce } } = source
          if(like_person.some(l => l.equals(userId))) {
            like = true
          }
          return {
            ...nextC,
            comment_users: comment_users.length,
            content: {
              ...nextContent,
              image: image.filter(i => i && !!i.src).map(i => i.src),
              video: video.filter(v => v && !!v.src).map(v => v.src)
            },
            source: {
              ...nextSoruce,
              type: source_type,
              content: name ? name : ( content || null )
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

module.exports = router