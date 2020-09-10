const Router = require('@koa/router')
const { CommentModel, dealErr, notFound, Params, responseDataDeal } = require('@src/utils')
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

router.get('/', async (ctx) => {
  const check = Params.query(ctx, {
    name: "_id",
    type: ['isMongoId']
  })
  if(check) return

  const [ currPage, pageSize, _id ] = Params.sanitizers(ctx.query, {
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
    _id
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
      ...(pageSize >= 0 ? { limit: pageSize } : {}),
      ...((currPage >= 0 && pageSize >= 0) ? { skip: pageSize * currPage } : {})
    },
  })
  .exec()
  .then(data => !!data && data._doc)
  .then(notFound)
  .then(data => {
    const { sub_comments, comment_users, content: { image, video, ...nextContent }, user_info: { _doc: { avatar, ...nextUserInfo } }, ...nextComment } = data
    return {
      sub: [...sub_comments.map(sub => {
        const { _doc: { comment_users, content: { image, video, ...nextContent }, user_info: { _doc: { avatar, ...nextInfo } }, ...nextSub } } = sub
        return {
          ...nextSub,
          comment_users: comment_users.map(com => {
            const { _doc: { avatar, ...nextCom } } = com
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
          like: false,
          user_info: {
            ...nextInfo,
            avatar: avatar ? avatar.src : null
          }
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
        like: false,
        comment_users: comment_users.length
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