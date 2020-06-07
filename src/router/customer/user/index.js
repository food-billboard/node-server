const Router = require('@koa/router')
const Comment = require('./routes/comment')
const Fans = require('./routes/fans')
const Attention = require('./routes/attention')
const Movie = require('./routes/movie')
const { verifyTokenToData, UserModel, dealErr } = require('@src/utils')

const router = new Router()

router
.use(async (ctx, next) => {
  const [, token] = verifyTokenToData(ctx)
  const { method } = ctx.request
  const { _id } = ctx.query
  const { url } = ctx.request
  const pathUrl = url.split("user")[1].split('?')[0]
  const newUrl = `/api/user/customer${url.split('user')[1]}`
  if(method.toLocaleLowerCase() == 'get') {
    if(token && _id) {
      if(!['', '/comment'].includes(pathUrl)) {
        return ctx.redirect(newUrl)
      }else {
        await next()
      }
    }else if(token && !_id) {
      ctx.status = 400
      ctx.body = JSON.stringify({
        success: false,
        res: null
      })
    }else if(!token && _id) {
      ctx.status = 401
      return ctx.redirect(newUrl)
    }else {
      ctx.status = 403
      ctx.body = JSON.stringify({
        success: false,
        res: null
      })
    }
  }else {
    ctx.status = 405
    ctx.body = JSON.stringify({
      success: false,
      res: null
    })
  }
})
//个人信息
.get('/', async (ctx) => {
  const [, token] = verifyTokenToData(ctx)
  let res
  const { _id } = ctx.query
  const { mobile } = token

  const data = await UserModel.find({
    $or: [
      {
        mobile: Number(mobile),
      },
      {
        _id: mongo.dealId(_id)
      }
    ]
  })
  .select({
    username: 1,
    avatar: 1,
    hot: 1,
    fans:1,
    attentions: 1,
    create_time: 1,
  })
  .exec()
  .then(data => {
    let result = []
    let mine
    let fans
    data.forEach(d => {
      const { _id:id, ...nextD } = d 
      if(id.equals(_id)) {
        const { fans, attentions,  } = nextD
        result = {
          ...result,
          ...nextD,
          fans: fans.length,
          attentions: attentions.length,
          like: false,
        }
        fans = [...fans]
      }else {
        mine = id
      }
    })

    if(mine && fans.some(f => f.equals(mine))) result.like = true
    return result
  })
  .catch(dealErr(ctx))

  // const data = await mongo.connect("user")
  // .then(db => db.find({
  //   $or: [
  //     {
  //       mobile: Number(mobile),
  //     },
  //     {
  //       _id: mongo.dealId(_id)
  //     }
  //   ]
  // }, {
  //   projection: {
  //     username: 1,
  //     avatar: 1,
  //     hot: 1,
  //     fans:1,
  //     attentions: 1,
  //     create_time: 1,
  //   }
  // }))
  // .then(data => data.toArray())
  // .then(data => {
  //   let result = []
  //   let mine
  //   let fans
  //   data.forEach(d => {
  //     const { _id:id, ...nextD } = d 
  //     if(mongo.equalId(_id, id)) {
  //       const { fans, attentions,  } = nextD
  //       result = {
  //         ...result,
  //         ...nextD,
  //         fans: fans.length,
  //         attentions: attentions.length,
  //         like: false,
  //       }
  //       fans = [...fans]
  //     }else {
  //       mine = id
  //     }
  //   })

  //   if(mine && fans.some(f => mongo.equalId(f, mine))) result.like = true
  //   return result
  // })
  // .catch(err => {
  //   errMsg = err
  //   return false
  // })

  if(data && data.err) {
    res = {
      ...data.res
    }
  }else {
    if(!data) {
      ctx.status = 401
      res = {
        success: false,
        res: {
          errMsg: '登录过期'
        }
      }
    }else {
      const { fans, attentions, ...nextData } = data
      res = {
        success: true,
        res: {
          data: {
            fans: fans.length,
            attentions: attentions.length,
            ...nextData
          }
        }
      }
    }
  }
  ctx.body = JSON.stringify(res)
})
.use('/fans', Fans.routes(), Fans.allowedMethods())
.use('/attention', Attention.routes(), Attention.allowedMethods())
.use('/movie', Movie.routes(), Movie.allowedMethods())
.use('/comment', Comment.routes(), Comment.allowedMethods())


module.exports = router