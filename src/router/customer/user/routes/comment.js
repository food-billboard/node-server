const Router = require('@koa/router')
const { verifyTokenToData, UserModel, dealErr, notFound, responseDataDeal, Params } = require('@src/utils')
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

router.get('/', async (ctx) => {
  const [, token] = verifyTokenToData(ctx)
  const { id } = token
  const check = Params.query(ctx, {
    name: '_id',
    type: ['isMongoId']
  })
  if(check) return

  const [ _id, currPage, pageSize ] = Params.sanitizers(ctx.query, {
    name: '_id',
    sanitizers: [
      data => ObjectId(data)
    ]
  }, {
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

  const data = await UserModel.find({
    _id: { $in: [ _id, ObjectId(id) ] }
  })
  .select({
    comment: 1,
    updatedAt: 1
  })
  .populate({
    path: 'comment',
    match: {
      user_info: _id
    },
    select: {
      source_type: 1,
      source: 1,
      createdAt: 1,
      updatedAt: 1,
      total_like: 1,
      content: 1,
      like_person: 1
    },
    options: {
      ...(pageSize >= 0 ? { limit: pageSize } : {}),
      ...((currPage >= 0 && pageSize >= 0) ? { skip: pageSize * currPage } : {})
    },
    populate: {
      path: 'source',
      select: {
        name: 1,
        content: 1
      }
    },
    populate: {
      path: 'user_info',
      select: {
        _id: 0,
        avatar: 1,
        username: 1
      }
    }
  })
  .exec()
  .then(data => !!data && data)
  .then(notFound)
  .then(data => {
    let result = {}
    let mine = {}
    const index = data.findIndex(d => d._id.equals(_id))
    if(!~index) return Promise.reject({errMsg: 'not Found', status: 404})
    result = {
      ...data[index]._doc
    } 
    mine = {
      ...data[(index + 1) % 2]._doc
    }
    const { _id:mineId } = mine
    const { comment, updatedAt } = result
    let like = false
    return {
      data: {
        ...result,
        comment: comment.map(c => {
          const { _doc: { 
            like_person, 
            source_type,
            source: { name, content, _id }={}, 
            content: { image, video, ...nextContent }, 
            user_info: { _doc: { avatar, ...nextUserInfo } },
            ...nextC 
          } } = c

          like = false
          if(like_person.some(l => l.equals(mineId))) like = true
          return {
            ...nextC,
            user_info: {
              ...nextUserInfo,
              avatar: avatar ? avatar.src : null
            },
            content: {
              ...nextContent,
              image: image.filter(i => i && !!i.src).map(i => i.src),
              video: video.filter(v => v && !!v.src).map(v => v.src)
            },
            source: {
              _id,
              content: !!name ? name : ( content || null ),
              type: source_type
            },
            like
          }
        })
      }
    }
  })
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data,
    needCache: false
  })

})

module.exports = router