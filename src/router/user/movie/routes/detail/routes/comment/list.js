const Router = require('@koa/router')
const { MovieModel, dealErr, notFound, Params } = require('@src/utils')
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
  const data = await MovieModel.findOne({
    _id
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
      ...(pageSize >= 0 ? { limit: pageSize } : {}),
      ...((currPage >= 0 && pageSize >= 0) ? { skip: pageSize * currPage } : {})
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