const Router = require('@koa/router')
const { verifyTokenToData, CommentModel, UserModel, dealErr, notFound, Params, responseDataDeal } = require('@src/utils')
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
      data => data >= 0 ? data : -1
    ]
	}, {
		name: 'pageSize',
		_default: 30,
    type: [ 'toInt' ],
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

  const data = await CommentModel.findOne({
    _id: commentId
  })
  .select({
    source: 0,
  })
  .populate({
    path: 'sub_comments',
    select: {
      sub_comments: 0,
      source: 0,
    },
    options: {
      ...(pageSize >= 0 ? { limit: pageSize } : {}),
      ...((currPage >= 0 && pageSize >= 0) ? { skip: pageSize * currPage } : {})
    },
  })
  .exec()
  .then(notFound)
  .then(data => {
    id = ObjectId(id)
    const { sub_comments, like_person, comment_users, content: { image, video, ...nextContent }, user_info: { avatar, ...nextUserInfo }, ...nextComment } = data
    return {
      data: {
        sub: [...sub_comments.map(sub => {
          const { comment_users, like_person, content: { image, video, ...nextContent }, user_info: { avatar, ...nextInfo }, ...nextSub } = sub
          return {
            ...nextSub,
            comment_users: comment_users.map(com => {
              const { avatar, ...nextCom } = com
              return {
                ...nextCom,
                avatar: avatar ? avatar.src : null
              }
            }),
            content: {
              ...nextContent,
              image: image.filter(i => i && !!i.src).map(i => i.src),
              video: image.filter(v => v && !!v.src).map(v => v.src),
            },
            user_info: {
              ...nextInfo,
              avatar: avatar ? avatar.src : null
            },
            like: like_person.some(person => person.equals(id))
          }
        })],
        comment: {
          ...nextComment,
          content: {
            ...nextContent,
            image: image.filter(i => i && !!i.src).map(i => i.src),
            video: image.filter(v => v && !!v.src).map(v => v.src),
          },
          user_info: {
            ...nextUserInfo,
            avatar: avatar ? avatar.src : null
          },
          comment_users: comment_users.length,
          like: like_person.some(person => person.equals(id))
        }
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