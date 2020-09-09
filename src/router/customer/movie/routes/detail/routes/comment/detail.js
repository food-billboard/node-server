const Router = require('@koa/router')
const { verifyTokenToData, CommentModel, UserModel, dealErr, notFound, Params } = require('@src/utils')
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

router
.get('/', async (ctx) => {
  const check = Params.query(ctx, {
    name: "_id",
    type: ['isMongoId']
  })
  if(check) {
    ctx.body = JSON.stringify({
      ...check.res
    })
    return
  }

  const [ , token ] = verifyTokenToData(ctx)
  const { mobile } = token
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
  let res 
  let mineId

  const data = await UserModel.findOne({
    mobile: Number(mobile)
  })
  .select({
    _id: 1
  })
  .exec()
  .then(data => !!data && data._doc)
  .then(notFound)
  .then(data => {
    const { _id } = data
    mineId = _id
    return CommentModel.findOne({
      _id: commentId
    })
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
  .then(data => !!data && data._doc)
  .then(notFound)
  .then(data => {
    const { sub_comments, like_person, comment_users, content: { image, video, ...nextContent }, user_info: { _doc: { avatar, ...nextUserInfo } }, ...nextComment } = data
    return {
      sub: [...sub_comments.map(sub => {
        const { _doc: { comment_users, like_person, content: { image, video, ...nextContent }, user_info: { _doc: { avatar, ...nextInfo } }, ...nextSub } } = sub
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
          user_info: {
            ...nextInfo,
            avatar: avatar ? avatar.src : null
          },
          like: like_person.some(person => person.equals(mineId))
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
        like: like_person.some(person => person.equals(mineId))
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