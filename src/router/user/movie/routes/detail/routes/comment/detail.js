const Router = require('@koa/router')
const { CommentModel, dealErr, notFound, Params } = require('@src/utils')
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

router.get('/', async (ctx) => {
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
  let res 
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