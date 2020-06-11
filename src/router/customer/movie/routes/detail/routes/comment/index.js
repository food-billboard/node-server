const Router = require('@koa/router')
const Like = require('./like')
const { verifyTokenToData, UserModel, CommentModel, MovieModel, dealErr, dealMedia, notFound } = require("@src/utils")
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
.post('/movie', async (ctx) => {
  const { body: { content: {
    text='',
    video=[],
    image=[]
  }, _id } } = ctx.request
  const [, token] = verifyTokenToData(ctx)
  const { mobile } = token
  let res

  const data = await UserModel.findOne({
    mobile: Number(mobile)
  })
  .select({
    _id: 1
  })
  .exec()
  .then(data => !!data && data._id)
  .then(notFound)
  .then(id => {
    dealMedia()
    //图片视频处理
    return {
      id,
      video: [],
      image: []
    }
  })
  .then(({id, video, image}) => {
    const comment = new CommentModel({
      ...TEMPLATE_COMMENT,
      source: {
        type: 'MOVIE',
        comment: ObjectId(_id)
      },
      user_info: id,
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
          _id: ObjectId(_id)
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
    video=[],
    image=[]
  }, _id } } = ctx.request
  const [, token] = verifyTokenToData(ctx)
  const { mobile } = token
  let res

  const data = await UserModel.findOne({
    mobile: Number(mobile)
  })
  .select({
    _id: 1
  })
  .exec()
  .then(data => !!data && data._id)
  .then(notFound)
  .then(id => {
    dealMedia()
    //图片视频处理
    return {
      id,
      video: [],
      image: []
    }
  })
  .then(({id, video, image}) => {
    const comment = new CommentModel({
      ...TEMPLATE_COMMENT,
      source: {
        type: 'USER',
        comment: ObjectId(_id)
      },
      user_info: id,
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
          _id: ObjectId(_id)
        }, {
          $push: { sub_comments: commentId },
          $addToSet: { comment_users: [userId] }
        }),
        UserModel.updateOne({
          mobile: Number(mobile),
          _id: ObjectId(_id)
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