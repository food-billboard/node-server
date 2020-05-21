const Router = require('@koa/router')
const Like = require('./like')
const { MongoDB, verifyTokenToData } = require("@src/utils")

const router = new Router()
const mongo = MongoDB()

const TEMPLATE_COMMENT = {
  source: {
    type: 'movie',
    comment: ''
  },
  user_info: '',
	create_time: Date.now(),
	sub_comments: [],
  total_like: 0,
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
  let errMsg
  let numNumber = Number(mobile)

  await mongo.connect("user")
  .then(db => db.findOne({
    mobile: numNumber
  }, {
    _id: 1
  }))
  .then(data => {
    const { _id:user_info } = data
    return mongo.connect("comment")
    .then(db => db.insertOne({
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
    const { ops } = data
    const { _id:commentId } = ops[0]
    return Promise.all([
      mongo.connect("movie")
      .then(db => db.updateOne({
        _id: mongo.dealId(_id)
      }, {
        $push: { comment: commentId }
      })),
      mongo.connect("user")
      .then(db => db.updateOne({
        mobile: numNumber
      }, {
        $push: { comment: commentId }
      }))
    ])
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
.post('/', async(ctx) => {
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
  let numNumber = Number(mobile)

  await mongo.connect("user")
  .then(db => db.findOne({
    mobile: numNumber
  }, {
    projection: {
      _id: 1
    }
  }))
  .then(data => {
    const { _id:user_info } = data
    userId = user_info
    return mongo.connect("comment")
    .then(db => db.insertOne({
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
    const { ops } = data
    const { _id:commentId } = ops[0]
    return Promise.all([
      mongo.connect("comment")
      .then(db => db.updateOne({
        _id: mongo.dealId(_id)
      }, {
        $push: { sub_comments: commentId },
        $addToSet: { comment_users: [userId] }
      })),
      mongo.connect("user")
      .then(db => db.updateOne({
        mobile: numNumber,
        _id: mongo.dealId(_id)
      }, {
        $push: { comment: commentId },
      }))
    ])
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