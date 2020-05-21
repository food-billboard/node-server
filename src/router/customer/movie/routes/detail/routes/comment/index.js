const Router = require('@koa/router')
const Like = require('./like')
const { MongoDB, verifyTokenToData } = require("@src/utils")

const router = new Router()
const mongo = MongoDB()

// data: { content: 内容, id: 回复的评论id或电影id  }

const TEMPLATE_COMMENT = {
  source: {
    type: 'movie',
    comment: ''
  },
  user_info: '',
	create_time: Date.now(),
	sub_comments: [],
  hot: 0,
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
  let errMsg

  const data = await mongo.connect("user")
  .then(db => db.findOne({
    mobile
  }, {
    _id: 1
  }))
  .then(data => {
    const { _id:user_info } = data
    return mongo.connect("comment")
    .then(db => db.insert({
      ...TEMPLATE_COMMENT,
      source: {
        type: 'movie',
        comment: mongo.dealId(_id)
      },
      create_time: Date.now(),
      user_info,
      content: {
        text,
        video,
        image
      }
    }))
  })
  .then(data => {
    const { _id:commentId } = data
    return mongo.connect("movie")
    .then(db => db.updateOne({
      _id: mongo.dealId(_id)
    }, {
      $push: { comment: commentId }
    }))
  })
  .catch(err => {
    console.log(err)
    errMsg = err
    return false
  })

  if(errMsg) {
    ctx.status = 500
    res = {
      success: false,
      res: {
        errMsg
      }
    }
  }else {
    res = {
      success: true,
      res: null
    }
  }

  ctx.body = JSON.stringify(res)
  
})
.post('/comment', async(ctx) => {
  const { body: { content: {
    text='',
    video=[],
    image=[]
  }, _id } } = ctx.request
  const [, token] = verifyTokenToData(ctx)
  const { mobile } = token
  let res
  let userId
  let errMsg

  const data = await mongo.connect("user")
  .then(db => db.findOne({
    mobile
  }, {
    projection: {
      _id: 1
    }
  }))
  .then(data => {
    const { _id:user_info } = data
    userId = user_info
    return mongo.connect("comment")
    .then(db => db.insert({
      ...TEMPLATE_COMMENT,
      source: {
        type: 'user',
        comment: mongo.dealId(_id)
      },
      create_time: Date.now(),
      user_info,
      content: {
        text,
        video,
        image
      }
    }))
  })
  .then(data => {
    const { _id:commentId } = data
    return mongo.connect("comment")
    .then(db => db.updateOne({
      _id: mongo.dealId(_id)
    }, {
      $push: { sub_comments: commentId },
      $addToSet: { comment_users: [userId] }
    }))
  })
  .catch(err => {
    console.log(err)
    errMsg = err
    return false
  })

  if(errMsg) {
    ctx.status = 500
    res = {
      success: false,
      res: {
        errMsg
      }
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