const Router = require('@koa/router')
const Like = require('./like')
const { verifyTokenToData, UserModel, CommentModel, MovieModel, dealErr, notFound, Params } = require("@src/utils")
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

const TEMPLATE_COMMENT = {
	sub_comments: [],
  like_person: [],
  content: {
    text: '',
    video: [],
    image: []
  },
  comment_users: []
}

router
.use(async(ctx, next) => {
  const { url, method } = ctx
  let _method
  let validate = [
    {
      name: '_id',
      type: [ 'isMongoId' ]
    }
  ]
  if(/.+\/comment(\/movie)?$/g.test(url)) {
    validate = [
      ...validate,
      {
        name: "content",
        validator: [
          data => !!Object.keys(data).length && ( 
            !!data.text
            &&
            ( data.video ? data.video.every(d => ObjectId.isValid(d)) : true )
            &&
            ( data.image ? data.image.every(d => ObjectId.isValid(d)) : true )
          )
        ]
      }
    ]
  }
  if(method.toLowerCase() === 'get' || method.toLowerCase() === 'delete') _method = 'query'
  if(method.toLowerCase() === 'put' || method.toLowerCase() === 'post') _method = 'body' 
  
  const check = Params[_method](ctx, ...validate)
  if(check) {
    ctx.body = JSON.stringify({
      ...check.res
    })
    return
  }

  return await next()
})
.post('/movie', async (ctx) => {
  const { body: { content: {
    text='',
  } } } = ctx.request
  const [ _id, image, video ] = Params.sanitizers(ctx.request.body, {
    name: '_id',
    sanitizers: [
      data => ObjectId(data)
    ]
  },
  {
    name: 'content.image',
    sanitizers: [
      data => data ? data.map(d => ObjectId(d)) : []
    ]
  },
  {
    name: 'content.video',
    sanitizers: [
      data => data ? data.map(d => ObjectId(d)) : []
    ]
  })
  const [, token] = verifyTokenToData(ctx)
  const { mobile } = token
  let res

  const data = await Promise.all([
    UserModel.findOne({
      mobile: Number(mobile)
    })
    .select({
      _id: 1
    })
    .exec()
    .then(data => !!data && data._id)
    .then(notFound),
    MovieModel.findOne({
      _id
    })
    .select({
      _id: 1
    })
    .exec()
    .then(data => !!data && data._id)
    .then(notFound),
  ])
  .then(([userId, _]) => {
    const comment = new CommentModel({
      ...TEMPLATE_COMMENT,
      source_type: 'movie',
      source: _id,
      user_info: userId,
      content: {
        text,
        video,
        image
      }
    })

    return comment
  })
  .then(comment => {
    return comment.save()
    .then(data => {
      const { _id: commentId } = data
      return Promise.all([
        MovieModel.updateOne({
          _id
        }, {
          $push: { comment: commentId }
        }),
        UserModel.updateOne({
          mobile: Number(mobile)
        }, {
          $push: { comment: commentId }
        })
      ])
    })
  })
  .then(_ => true)
  .catch(dealErr(ctx))

  if(data && data.err) {
    res = {
      ...data.res
    }
  }else {
    res = {
      success: true,
      res: null
    }
  }

  ctx.body = JSON.stringify(res)
  
})
.post('/', async(ctx) => {
  const { body: { content: {
    text='',
  } } } = ctx.request
  const [ _id, image, video ] = Params.sanitizers(ctx.request.body, {
    name: '_id',
    sanitizers: [
      data => ObjectId(data)
    ]
  },
  {
    name: 'content.image',
    sanitizers: [
      data => data ? data.map(d => ObjectId(d)) : []
    ]
  },
  {
    name: 'content.video',
    sanitizers: [
      data => data ? data.map(d => ObjectId(d)) : []
    ]
  })
  const [, token] = verifyTokenToData(ctx)
  const { mobile } = token
  let res

  const data = await Promise.all([
    UserModel.findOne({
      mobile: Number(mobile)
    })
    .select({
      _id: 1
    })
    .exec()
    .then(data => !!data && data._id)
    .then(notFound),
    CommentModel.findOne({
      _id
    })
    .select({
      _id: 1
    })
    .exec()
    .then(data => !!data && data._id)
    .then(notFound),
  ])
  .then(([userId, _]) => {
    const comment = new CommentModel({
      ...TEMPLATE_COMMENT,
      source_type: "user",
      source: _id,
      user_info: userId,
      content: {
        text,
        video,
        image
      }
    })

    return {
      comment,
      userId: id
    }
  })
  .then(({ comment, userId }) => {
    return comment.save()
    .then(data => {
      const { _id: commentId } = data
      return Promise.all([
        CommentModel.updateOne({
          _id
        }, {
          $push: { sub_comments: commentId },
          $addToSet: { comment_users: [userId] }
        }),
        UserModel.updateOne({
          mobile: Number(mobile),
          _id
        }, {
          $push: { comment: commentId },
        })
      ])
    })
  })
  .then(_ => true)
  .catch(dealErr(ctx))

  if(data && data.err) {
    res = {
      ...data.res
    }
  }else {
    res = {
      success: true,
      res: null
    }
  }

  ctx.body = JSON.stringify(res)
})
.use('/like', Like.routes(), Like.allowedMethods())

module.exports = router