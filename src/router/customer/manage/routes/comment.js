const Router = require('@koa/router')
const { verifyTokenToData, UserModel, dealErr, notFound, Params } = require('@src/utils')

const router = new Router()

router.get('/', async (ctx) => {
  const [, token] = verifyTokenToData(ctx)
  const { mobile } = token
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
  let res

  const data = await UserModel.findOne({
    mobile: Number(mobile)
  })
  .select({
    comment: 1
  })
  .populate({
    path: 'comment',
    options: {
      ...(pageSize >= 0 ? { limit: pageSize } : {}),
      ...((currPage >= 0 && pageSize >= 0) ? { skip: pageSize * currPage } : {})
    },
    select: {
      source: 1,
      createdAt: 1,
      updatedAt: 1,
      total_like: 1,
      content: 1,
      like_person: 1
    },
    populate: {
      path: 'source',
      select: {
        name: 1,
        content: 1
      }
    }
  })
  .exec()
  .then(data => !!data && data._doc)
  .then(notFound)
  .then(data => {
    const { comment, _id: userId } = data
    let like = false
    return comment.map(c => {
      like = false
      const { 
        _doc: { 
          like_person, 
          content: { image, video, ...nextContent }, 
          source: { name, content, ...nextSoruce }={}, 
          user_info: { _doc: { avatar, ...nextUserInfo } }, 
          ...nextC 
        } 
      } = c
      if(like_person.some(l => l.equals(userId))) {
        like = true
      }
      return {
        ...nextC,
        content: {
          ...nextContent,
          image: image.filter(i => i && !!i.src).map(i => i.src),
          video: video.filter(v => v && !!v.src).map(v => v.src)
        },
        source: {
          ...nextSoruce,
          content: name ? name : ( content ? content : null )
        },
        like,
        user_info: {
          ...nextUserInfo,
          avatar: avatar ? avatar.src : null,
        }
      }
    })
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