const Router = require('@koa/router')
const { verifyTokenToData, UserModel, dealErr, notFound } = require('@src/utils')
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

router.get('/', async (ctx) => {
  const [, token] = verifyTokenToData(ctx)
  const { mobile } = token
  const { currPage=0, pageSize=30, _id } = ctx.query
  let res

  const data = await UserModel.find({
    $or: [ { mobile: Number(mobile) }, { _id: ObjectId(_id) } ]
  })
  .select({
    comment: 1
  })
  .populate({
    path: 'comment',
    match: {
      user_info: ObjectId(_id)
    },
    select: {
      source: 1,
      createdAt: 1,
      updatedAt: 1,
      toal_like: 1,
      content: 1,
      like_person: 1
    },
    options: {
      limit: pageSize,
      skip: currPage * pageSize
    },
    populate: {
      path: 'source',
      select: {
        name: 1,
        content: 1
      }
    },
  })
  .exec()
  .then(data => !!data && data._doc)
  .then(notFound)
  .then(data => {
    let result = {}
    let mine = {}
    const index = data.findIndex(d => d.user_info.equals(_id))
    if(!~index) return Promise.reject({err: null, data: []})
    result = {
      ...data[index]
    } 
    mine = {
      ...data[(index + 1) % 2]
    }
    const { _id:mineId } = mine
    const { _id, comment } = result
    let like = false
    return {
      comment: comment.map(c => {
        const { _doc: { like_person, source: { name, content, ...nextSource }, content: { image, video, ...nextContent }, ...nextC } } = c
        like = false
        if(like_person.some(l => l.equals(mineId))) like = true
        return {
          ...nextC,
          content: {
            ...nextContent,
            image: image.filter(i => !!i.src).map(i => i.src),
            video: video.filter(v => !!v.src).map(v => v.src)
          },
          source: {
            ...nextSource,
            content: name ? name : ( content || null )
          },
          like
        }
      })
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