const Router = require('@koa/router')
const Comment = require('./comment')
const User = require('./user')
const Info = require('./info')
const Tag = require('./tag')
const Valid = require('./valid')
const { MovieModel, dealErr, notFound, responseDataDeal, Params } = require('@src/utils')
const { Types: { ObjectId }, Aggregate } = require('mongoose')

const router = new Router()

router
//电影详细信息
.get('/', async(ctx) => {

  const check = Params.query(ctx, {
    name: '_id',
    validator: [
      data => ObjectId.isValid(data)
    ]
  })

  if(check) return

  const [ _id ] = Params.sanitizers(ctx.query, {
    name: '_id',
    sanitizers: [
      data => ObjectId(data)
    ]
  })

  const aggregate = new Aggregate()

  aggregate.model(MovieModel)

  const data = await aggregate.match({
    _id
  })
  .lookup({
    from: 'users', 
    localField: 'author', 
    foreignField: '_id', 
    as: 'author'
  })
  .unwind("author")
  .lookup({
    from: 'images', 
    localField: 'images', 
    foreignField: '_id', 
    as: 'images'
  })
  .lookup({
    from: 'videos', 
    localField: 'video', 
    foreignField: '_id', 
    as: 'video'
  })
  .unwind("video")
  .lookup({
    from: 'classifies', 
    localField: 'info.classify', 
    foreignField: '_id', 
    as: 'classify'
  })
  .project({
    name: 1,
    video: "$video.src",
    classify: "$classify.name",
    images: "$images.src",
    poster: 1,
    createdAt: 1,
    updatedAt: 1,
    glance: 1,
    hot: 1,
    rate_person: 1,
    total_rate: 1,
    source_type: 1,
    status: 1,
    barrage_count: {
      $size: {
        $ifNull: [
          "$barrage", []
        ]
      }
    },
    tag_count: {
      $size: {
        $ifNull: [
          "$tag", []
        ]
      }
    },
    comment_count: {
      $size: {
        $ifNull: [
          "$comment", []
        ]
      }
    },
    author: {
      _id: "$author._id",
      username: "$author.username"
    },
  })
  .then(data => !!data && data.length == 1 && data[0])
  .then(notFound)
  // {
  //   data: {
  //     _id,
  //     name,
  //     classify,
  //     images,
  //     poster,
  //     createdAt,
  //     updatedAt,
  //     glance,
  //     hot,
  //     rate_person,
  //     total_rate,
  //     source_type,
  //     status,
  //     barrage_count,
  //     tag_count,
  //     comment_count,
  //     author,
  //     images: [],
  //     video
  //   }
  // }
  .then(data => ({ data }))
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data,
    needCache: false
  })

})
.use('/comment', Comment.routes(), Comment.allowedMethods())
.use('/user', User.routes(), User.allowedMethods())
.use('/info', Info.routes(), Info.allowedMethods())
.use('/tag', Tag.routes(), Tag.allowedMethods())
.use('/valid', Valid.routes(), Valid.allowedMethods())

module.exports = router