require('module-alias/register')
const { expect } = require('chai')
const { mockCreateUser, mockCreateImage, mockCreateMovie, mockCreateVideo, mockCreateComment, Request, createEtag, commonValidate } = require('@test/utils')
const { UserModel, ImageModel, VideoModel, CommentModel, MovieModel, COMMENT_SOURCE_TYPE } = require('@src/utils')
const Day = require('dayjs')

const COMMON_API = '/api/customer/manage/comment'

function responseExpect(res, validate=[]) {

  const { res: { data: target } } = res

  expect(target).to.be.a('object').and.that.includes.all.keys('comment')

  target.comment.forEach(item => {

    expect(item).to.be.a('object').and.that.includes.all.keys(
      'comment_users', 'content', 'createdAt', 'updatedAt', 'like', 'total_like',
      '_id', 'source', 'user_info'
    )

    commonValidate.number(item.comment_users)
    expect(item.content).to.be.a('object').and.includes.all.keys('text', 'image', 'video')
    commonValidate.string(item.content.text, function(target) { return true })
    item.content.image.forEach(item => commonValidate.poster(item))
    item.content.video.forEach(item => {
      expect(item).to.be.a('object').and.that.includes.any.keys('src', 'poster')
      commonValidate.poster(item.src)
      if(item.poster) {
        commonValidate.poster(item.poster)
      }
    })

    commonValidate.time(item.createdAt)
    commonValidate.time(item.updatedAt)
    expect(item.like).to.be.a('boolean')
    commonValidate.number(item.total_like)
    commonValidate.objectId(item._id)
    
    // expect(item.source).to.be.a('object').and.includes.all.keys('_id', 'content', 'type')
    // commonValidate.objectId(item.source._id)

    // commonValidate.string(item.source.type, function(target) {
    //   return !!~['movie', 'comment'].indexOf(target.toLowerCase())
    // })

    expect(item.user_info).to.be.a('object').and.that.includes.all.keys('avatar', '_id', 'username')
    commonValidate.poster(item.user_info.avatar)
    commonValidate.objectId(item.user_info._id)
    commonValidate.string(item.user_info.username)

  })

  if(Array.isArray(validate)) {
    validate.forEach(valid => {
      typeof valid == 'function' && valid(target)
    })
  }else if(typeof validate == 'function') {
    validate(target)
  }
}

describe(`${COMMON_API} test`, function() {

  let userId
  let selfToken
  let imageId
  let videoId
  let movieId
  let result

  before(async function() {

    const { model: video } = mockCreateVideo({
      src: COMMON_API
    })
    const { model: image } = mockCreateImage({
      src: COMMON_API
    })
    const { model: user, signToken } = mockCreateUser({
      username: COMMON_API
    })
    const { model:movie } = mockCreateMovie({
      name: COMMON_API
    })

    await Promise.all([
      image.save(),
      video.save(),
      user.save(),
      movie.save()
    ])
    .then(([image, video, user, movie]) => {
      imageId = image._id
      videoId = video._id
      userId = user._id
      movieId = movie._id
      selfToken = signToken(userId)
      const { model } = mockCreateComment({
        content: {
          text: COMMON_API,
          image: [ imageId ],
          video: [ videoId ]
        },
        source_type: 'movie',
        source: movieId,
        user_info: userId,
        like_person: [ userId ]
      })

      return model.save()
    })
    .then(data => {
      result = data
      return UserModel.updateOne({
        _id: userId
      }, {
        $set: {
          comment: [ data._id ]
        }
      })
    })
    .catch(err => {
      console.log('oops: ', err)
    })

    return Promise.resolve()

  })

  after(async function() {

    Promise.all([
      ImageModel.deleteMany({
        src: COMMON_API
      }),
      VideoModel.deleteMany({
        src: COMMON_API
      }),
      CommentModel.deleteMany({
        "content.text": COMMON_API
      }),
      UserModel.deleteMany({
        username: COMMON_API
      }),
      MovieModel.deleteMany({
        name: COMMON_API
      })
    ])
    .catch(err => {
      console.log('oops: ', err)
    })

    return Promise.resolve()

  })

  describe(`get self comment success test -> ${COMMON_API}`, function() {

    beforeEach(async function() {

      updatedAt = await UserModel.findOne({
        _id: userId,   
      })
      .select({
        _id: 0,
        updatedAt: 1
      })
      .exec()
      .then(data => {
        return data._doc.updatedAt
      })
      .catch(err => {
        console.log('oops: ', err)
        return false
      })

      return !!updatedAt ? Promise.resolve() : Promise.reject(COMMON_API)

    })
    
    it(`get self comment success`, function(done) {

      Request
      .get(COMMON_API)
      .set({
        Accept: 'Application/json',
        Authorization: `Basic ${selfToken}`
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        const { res: { text } } = res
        let obj
        try{
          obj = JSON.parse(text)
        }catch(_) {
          console.log(_)
        }
        responseExpect(obj)
        done()
      })

    })

    it.skip(`get self comment success and return the status of 304`, function(done) {

      Request
      .get(COMMON_API)
      .set({
        Accept: 'Application/json',
        'If-Modified-Since': updatedAt,
        'If-None-Match': createEtag({}),
        Authorization: `Basic ${selfToken}`
      })
      .expect(304)
      .expect('Last-Modified', updatedAt.toString())
      .expect('ETag', createEtag({}))
      .end(function(err, _) {
        if(err) return done(err)
        done()
      })

    })

    it.skip(`get self comment success and hope return the status of 304 but the content has edited`, function(done) {

      Request
      .get(COMMON_API)
      .set({
        Accept: 'Application/json',
        'If-Modified-Since': new Date(Day(updatedAt).valueOf - 10000000),
        'If-None-Match': createEtag({}),
        Authorization: `Basic ${selfToken}`
      })
      .expect(200)
      .expect('Last-Modified', updatedAt.toString())
      .expect('ETag', createEtag({}))
      .end(function(err, _) {
        if(err) return done(err)
        done()
      })

    })

    it.skip(`get self comment success and hope return the status of 304 but the params of query is change`, function(done) {

      const query = {
        pageSize: 10
      }

      Request
      .get(COMMON_API)
      .query(query)
      .set({
        Accept: 'Application/json',
        'If-Modified-Since': new Date(Day(result.updatedAt).valueOf - 10000000),
        'If-None-Match': createEtag({}),
        Authorization: `Basic ${selfToken}`
      })
      .expect(200)
      .expect('Last-Modified', updatedAt.toString())
      .expect('ETag', createEtag(query))
      .end(function(err, _) {
        if(err) return done(err)
        done()
      })

    })

  })

  describe(`delete self comment success test -> ${COMMON_API}`, function() {

    it(`delete comment success`, function(done) {

      let movieCommentId 
      let commentCommentId 

      const { model: movieComment } = mockCreateComment({
        source_type: COMMENT_SOURCE_TYPE.movie,
        source: movieId,
        content: {
          text: COMMON_API,
          image: [ imageId ],
          video: []
        },
        user_info: userId,
        total_like: 10
      })

      movieComment.save()
      .then(data => {
        movieCommentId = data._id 
        const { model: commentComment } = mockCreateComment({
          source_type: COMMENT_SOURCE_TYPE.comment,
          source: movieCommentId,
          content: {
            text: COMMON_API,
            image: [ imageId ],
            video: []
          },
          user_info: userId,
          total_like: 10
        })
        return commentComment.save()
      })
      .then(data => {
        commentCommentId = data._id 
        return Promise.all([
          MovieModel.updateOne({
            _id: movieId,
          }, {
            $push: {
              comment: movieCommentId
            }
          }),
          CommentModel.updateOne({
            _id: movieCommentId
          }, {
            $push: {
              sub_comments: commentCommentId
            }
          })
        ])
      })
      .then(_ => {
        return Request
        .delete(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .query({
          _id: movieCommentId.toString()
        })
        .expect(200)
        .expect('Content-Type', /json/)
      })
      .then(function(data) {
        return Promise.all([
          CommentModel.find({
            _id: {
              $in: [
                commentCommentId,
                movieCommentId
              ]
            }
          })
          .select({
            _id: 1
          })
          .exec(),
          UserModel.findOne({
            _id: userId,
            comment: {
              $in: [
                movieCommentId,
                commentCommentId 
              ]
            }
          })
          .select({
            _id: 1
          })
          .exec(),
          MovieModel.findOne({
            _id: movieId,
            comment: {
              $in: [
                movieCommentId
              ]
            }
          })
        ])
      })
      .then(([comment, user, movie]) => {
        expect(comment.length).to.be.equal(0) 
        expect(!!user).to.be.false
        expect(!!movie).to.be.false
        done()
      })
      .catch(err => {
        done(err)
      })

    
    
    })

  })

  describe(`delete self comment fail test -> ${COMMON_API}`, function() {

    it(`delete comment fail because the _id is not valid`, function(done) {

      Request
      .delete(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
        _id: result._id.toString().slice(1)
      })
      .expect(400)
      .expect('Content-Type', /json/)
      .end((err, res) => {
        if(err) return done(err) 
        done()
      })

    })

    it(`delete comment fail because not found the _id`, function(done) {

      Request
      .delete(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .expect(400)
      .expect('Content-Type', /json/)
      .end((err, res) => {
        if(err) return done(err) 
        done()
      })

    })

  })

})