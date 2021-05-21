require('module-alias/register')
const { expect } = require('chai')
const { 
  mockCreateImage, 
  Request, 
  mockCreateUser,
  mockCreateVideo,
  commonValidate,
  mockCreateComment,
  mockCreateMovie,
  createEtag
} = require('@test/utils')
const { CommentModel, ImageModel, UserModel, VideoModel, MovieModel } = require('@src/utils')
const Day = require('dayjs')

const COMMON_API = '/api/user/movie/detail/comment/detail'

function responseExpect(res, validate=[]) {

  const { res: { data: target } } = res 

  expect(target).to.be.a('object').and.that.includes.all.keys('comment', 'sub')
  const { comment, sub=[] } = target
  const array = [ comment, ...sub ]
  array.forEach(item => {
    expect(item).to.be.a('object').and.that.includes.all.keys(
      'comment_users', 'content', 'createdAt', 'updatedAt', 'total_like', 
      'like', 'user_info', '_id'
    )
    const { comment_users, content, createdAt, updatedAt, total_like, like, user_info, _id } = item
    if(typeof comment_users === 'number') {
      commonValidate.number(comment_users)
    }else if(typeof comment_users == 'string'){
      expect(Number.isNaN(parseInt(comment_users))).to.be.false
    }else{
      expect(comment_users).to.be.a('array')
      comment_users.forEach(tar => {
        expect(tar).to.be.a('object').and.that.includes.all.keys('avatar', 'username', '_id')
        commonValidate.poster(tar.avatar)
        commonValidate.string(tar.username)
        commonValidate.objectId(tar._id)
      })
    }
    expect(content).to.be.a('object').that.includes.all.keys('image', 'text', 'video')
    commonValidate.string(content.text, function(_) { return true })
    expect(content.video).to.be.a('array')
    content.video.forEach(item => {
      expect(item).to.be.a('object').and.that.includes.any.keys('src', 'poster')
      commonValidate.string(item.src)
      if(item.poster) {
        commonValidate.string(item.poster)
      }
    })
    expect(content.image).to.be.a('array')
    content.image.forEach(item => commonValidate.string(item))
    commonValidate.time(createdAt)
    commonValidate.time(updatedAt)
    commonValidate.number(total_like)
    expect(like).to.be.a('boolean')
    expect(user_info).to.be.a('object').and.that.includes.all.keys('avatar', 'username', '_id')
    commonValidate.poster(user_info.avatar)
    commonValidate.string(user_info.username)
    commonValidate.objectId(user_info._id)
    commonValidate.objectId(_id)
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

  describe(`get the comment detail without self info test -> ${COMMON_API}`, function() {

    let imageId
    let videoId
    let userId
    let movieId
    let commentId
    let result

    before(function(done) {

      const { model:image } = mockCreateImage({
        src: COMMON_API
      })

      image.save()
      .then(data => {
        imageId = data._id
        videoId = data._id
        const { model: video } = mockCreateVideo({
          src: COMMON_API,
          poster: imageId
        })
        const { model: user } = mockCreateUser({
          username: COMMON_API
        })

        return Promise.all([
          video.save(),
          user.save()
        ])
      })
      .then(([video, user]) => {
        userId = user._id
        videoId = video._id
        const { model } = mockCreateMovie({
          name: COMMON_API
        })

        return model.save()
      })
      .then(data => {
        movieId = data._id
        const { model } = mockCreateComment({
          source_type: 'movie',
          source: movieId,
          user_info: userId,
          content: {
            text: COMMON_API,
            image: [ imageId ],
            video: [ videoId ]
          },
          like_person: [userId],
          comment_users: [ userId ]
        })

        return model.save()
      })
      .then(data => {
        result = data
        commentId = result._id
        const { model } = mockCreateComment({
          source_type: 'comment',
          source: commentId,
          user_info: userId,
          content: {
            text: `${COMMON_API}-test`,
            image: [ imageId ],
            video: [ videoId ]
          },
        })

        return model.save()
      })
      .then(function(data) {
        return CommentModel.updateOne({
          "content.text": COMMON_API
        }, {
          $push: { sub_comments: data._id }
        })
      })
      .then(function() {
        done()
      })
      .catch(err => {
        console.log('oops: ', err)
      })
    })

    after(function(done) {

      Promise.all([
        ImageModel.deleteOne({
          src: COMMON_API
        }),
        VideoModel.deleteOne({
          src: COMMON_API
        }),
        UserModel.deleteOne({
          username: COMMON_API
        }),
        CommentModel.deleteMany({
          "content.image": [imageId]
        }),
        MovieModel.deleteMany({
          name: COMMON_API
        })
      ])
      .then(function() {
        done()
      })
      .catch(err => {
        console.log('oops: ', err)
      })

    })
    
    describe(`get the comment detail without self info success test -> ${COMMON_API}`, function() {

      it(`get the comment detail without self info success`, function(done) {

        Request
        .get(COMMON_API)
        .query({
          _id: commentId.toString()
        })
        .set({
          Accept: 'Application/json',
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

      it.skip(`get the comment detail without self info success and return the status of 304`, function(done) {

        const query = {
          _id: commentId.toString()
        }

        Request
        .get(COMMON_API)
        .query(query)
        .set({
          Accept: 'Application/json',
          'If-Modified-Since': result.updatedAt,
          'If-None-Match': createEtag(query)
        })
        .expect(304)
        .expect('Last-Modified', result.updatedAt.toString())
        .expect('ETag', createEtag(query))
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

      it.skip(`get the comment detail without self info success and hope return the status of 304 but the content has edited`, function(done) {

        const query = {
          _id: commentId.toString()
        }

        Request
        .get(COMMON_API)
        .query(query)
        .set({
          Accept: 'Application/json',
          'If-Modified-Since': new Date(Day(result.updatedAt).valueOf - 10000000),
          'If-None-Match': createEtag(query)
        })
        .expect(200)
        .expect('Last-Modified', result.updatedAt.toString())
        .expect('ETag', createEtag(query))
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

      it.skip(`get the comment detail without self info success and hope return the status of 304 but the params of query is change`, function(done) {

        const query = {
          offset: 0,
          _id: commentId.toString()
        }

        Request
        .get(COMMON_API)
        .query({
          _id: commentId.toString()
        })
        .set({
          Accept: 'Application/json',
          'If-Modified-Since': result.updatedAt,
          'If-None-Match': createEtag(query)
        })
        .expect(200)
        .expect('Last-Modified', result.updatedAt.toString())
        .expect('ETag', createEtag({
          _id: commentId.toString()
        }))
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

    })

    describe(`get the comment detail without self info fail test -> ${COMMON_API}`, function() {

      it(`get the comment detail without self info fail because the comment id is not found`, function(done) {

        const _id = commentId.toString()

        Request
        .get(COMMON_API)
        .query({
          _id: `${(parseInt(_id.slice(0, 1)) + 5) % 10}${_id.slice(1)}`
        })
        .set({
          Accept: 'Application/json'
        })
        .expect(404)
        .expect('Content-Type', /json/)
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

      it(`get the comment detail without self info fail because the comment id is not verify`, function(done) {

        Request
        .get(COMMON_API)
        .query({
          _id: commentId.toString().slice(1)
        })
        .set({
          Accept: 'Application/json'
        })
        .expect(400)
        .expect('Content-Type', /json/)
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

      it(`get the comment detail without self info fail because lack the params of comment id`, function(done) {
        
        Request
        .get(COMMON_API)
        .set({
          Accept: 'Application/json'
        })
        .expect(400)
        .expect('Content-Type', /json/)
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

    })

  })

})