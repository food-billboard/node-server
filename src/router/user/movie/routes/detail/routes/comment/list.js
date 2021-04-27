const Router = require('@koa/router')
const { omit } = require('lodash')
const { MovieModel, dealErr, notFound, Params, responseDataDeal, avatarGet } = require('@src/utils')
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

router.get('/', async (ctx) => {
  const check = Params.query(ctx, {
    name: "_id",
    validator: [
			data => ObjectId.isValid(data)
		]
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

  const data = await MovieModel.findOne({
    _id
  })
  .select({
    comment: 1,
    updatedAt: 1,
    _id: 0
  })
  .populate({
    path: 'comment',
    select: {
      sub_comments: 0,
      source: 0,
      like_person: 0,
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
  .then(notFound)
  .then(data => {
    const { comment } = data
    return {
      data: {
        ...data,
        comment: comment.map(c => {
          const { comment_users, content: { image, video, ...nextContent }, user_info, ...nextC } = c
          return {
            ...nextC,
            like: false,
            comment_users: comment_users.map(com => {
              const { avatar, ...nextCom } = com
              return {
                ...nextCom,
                avatar: avatarGet(avatar)
              }
            }),
            content: {
              ...nextContent,
              image: image.filter(i => i && !!i.src).map(i => avatarGet(i)),
              video: video.filter(v => v &&!!v.src).map(v => avatarGet(v)),
            },
            user_info: {
              ...omit(user_info || {}, ['avatar']),
              avatar: avatarGet((user_info || {}).avatar || {})
            }
          }
        })
      }
    }
  })
  .catch(err => {
    console.log(err)
    return dealErr(ctx)(err)
  })

  responseDataDeal({
    ctx,
    data
  })

})

module.exports = router