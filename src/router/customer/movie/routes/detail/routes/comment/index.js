const Router = require('@koa/router')
const Like = require('./like')
const { verifyTokenToData, UserModel, CommentModel, MovieModel, dealErr, dealMedia } = require("@src/utils")

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
    mobile: ~~mobile
  })
  .select({
    _id: 1
  })
  .exec()
  .then(data => !!data && data._id)
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
        comment: mongo.dealId(_id)
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
          mobile: ~~mobile
        }, {
          $push: { comment: commentId }
        })
      ])
    })
  })
  .then(_ => true)
  .catch(dealErr(ctx))

  // let errMsg
  // let numNumber = Number(mobile)

  // await mongo.connect("user")
  // .then(db => db.findOne({
  //   mobile: numNumber
  // }, {
  //   _id: 1
  // }))
  // .then(data => {
  //   const { _id:user_info } = data
  //   return mongo.connect("comment")
  //   .then(db => db.insertOne({
  //     ...TEMPLATE_COMMENT,
  //     source: {
  //       type: 'movie',
  //       comment: mongo.dealId(_id)
  //     },
  //     create_time: Date.now(),
  //     user_info,
  //     content: {
  //       text,
  //       video,
  //       image
  //     }
  //   }))
  // })
  // .then(data => {
  //   const { ops } = data
  //   const { _id:commentId } = ops[0]
  //   return Promise.all([
  //     mongo.connect("movie")
  //     .then(db => db.updateOne({
  //       _id: mongo.dealId(_id)
  //     }, {
  //       $push: { comment: commentId }
  //     })),
  //     mongo.connect("user")
  //     .then(db => db.updateOne({
  //       mobile: numNumber
  //     }, {
  //       $push: { comment: commentId }
  //     }))
  //   ])
  // })
  // .catch(err => {
  //   console.log(err)
  //   errMsg = err
  //   return false
  // })

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
    mobile: ~~mobile
  })
  .select({
    _id: 1
  })
  .exec()
  .then(data => !!data && data._id)
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
        comment: mongo.dealId(_id)
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
          mobile: ~~mobile,
          _id: ObjectId(_id)
        }, {
          $push: { comment: commentId },
        })
      ])
    })
  })
  .then(_ => true)
  .catch(dealErr(ctx))

  // let userId
  // let errMsg
  // let numNumber = Number(mobile)

  // await mongo.connect("user")
  // .then(db => db.findOne({
  //   mobile: numNumber
  // }, {
  //   projection: {
  //     _id: 1
  //   }
  // }))
  // .then(data => {
  //   const { _id:user_info } = data
  //   userId = user_info
  //   return mongo.connect("comment")
  //   .then(db => db.insertOne({
  //     ...TEMPLATE_COMMENT,
  //     source: {
  //       type: 'user',
  //       comment: mongo.dealId(_id)
  //     },
  //     create_time: Date.now(),
  //     user_info,
  //     content: {
  //       text,
  //       video,
  //       image
  //     }
  //   }))
  // })
  // .then(data => {
  //   const { ops } = data
  //   const { _id:commentId } = ops[0]
  //   return Promise.all([
  //     mongo.connect("comment")
  //     .then(db => db.updateOne({
  //       _id: mongo.dealId(_id)
  //     }, {
  //       $push: { sub_comments: commentId },
  //       $addToSet: { comment_users: [userId] }
  //     })),
  //     mongo.connect("user")
  //     .then(db => db.updateOne({
  //       mobile: numNumber,
  //       _id: mongo.dealId(_id)
  //     }, {
  //       $push: { comment: commentId },
  //     }))
  //   ])
  // })
  // .catch(err => {
  //   console.log(err)
  //   errMsg = err
  //   return false
  // })

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