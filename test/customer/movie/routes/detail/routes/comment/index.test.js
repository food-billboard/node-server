require('module-alias/register')
const { expect } = require('chai')
const { 
  mockCreateImage, 
  Request, 
  mockCreateUser,
  mockCreateVideo,
  commonValidate,
  mockCreateComment,
  mockCreateMovie
} = require('@test/utils')
const { CommentModel } = require('@src/utils')

const COMMON_API = '/api/customer/movie/detail/comment'

function responseExpect(res, validate=[]) {

  const { res: { data: target } } = res 

  expect(target).to.be.a('object').and.that.includes.all.keys('comment')

  target.comment.forEach(item => {
    expect(item).to.be.a('object').and.that.includes.all.keys(
      'comment_users', 'content', 'createdAt', 'updatedAt', 'total_like', 
      'like', 'user_info', '_id'
    )
    const { comment_users, content, createdAt, updatedAt, total_like, like, user_info, _id } = item
    expect(comment_users).to.be.satisfies(function(target) {
      if(typeof target === 'number') {
        commonValidate.number(target)
      }else {
        expect(target).to.be.a('array')
        target.forEach(tar => {
          expect(tar).to.be.a('object').and.that.includes.all.keys('avatar', 'username', '_id')
          commonValidate.poster(tar.avatar)
          commonValidate.string(tar.username)
          commonValidate.objectId(tar._id)
        })
      }
    })
    expect(content).to.be.a('object').that.includes.all.keys('image', 'text', 'video')
    commonValidate.string(content.text, function(_) { return true })
    expect(content.video).to.be.a('array')
    content.video.forEach(item => commonValidate.string(item))
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

  let userId
  let imageId
  let videoId
  let movieId
  let commentId
  let subCommentId
  let selfToken
  let userDatabase
  let imageDatabase
  let videoDatabase
  let commentDatabase
  let movieDatabase

  before(function(done) {

    const { model: image } = mockCreateImage({
      src: COMMON_API
    })

    imageDatabase = image

    imageDatabase.save()
    .then(data => {
      imageId = data._id

      const { model: video } = mockCreateVideo({
        src: COMMON_API,
        poster: imageId
      })
      const { model: user, token } = mockCreateUser({
        username: COMMON_API,
        avatar: imageId
      })

      videoDatabase = video
      selfToken = token
      userDatabase = user

      return Promise.all([
        videoDatabase.save(),
        userDatabase.save()
      ])
    })
    .then(([video, user]) => {
      videoId = video._id
      userId = user._id
      
      const { model: movie } = mockCreateMovie({
        name: COMMON_API,
        author: userId,
        source_type: 'USER',
        stauts: 'COMPLETE',
      })

      movieDatabase = movie

      return movieDatabase.save()

    })
    .then(data => {
      movieId = data._id
      const { model: comment } = mockCreateComment({
        content: {
          text: COMMON_API,
          video: [ videoId ],
          image: [ imageId ]
        },
        source_type: 'movie',
        source: movieId,
        comment_users: [ userId ],
        sub_comments: []
      })

      const { model: subComment } = mockCreateComment({
        content: {
          text: COMMON_API,
          video: [ videoId ],
          image: [ imageId ]
        },
        source_type: 'user',
        source: userId,
      })

      commentDatabase = comment
      subCommentDatabase = subComment

      return Promise.all([
        commentDatabase.save(),
        subCommentDatabase.save()
      ])
    })
    .then(([comment, subComment]) => {

      commentId = comment._id
      subCommentId = subComment._id

      return Promise.all([

        commentDatabase.updateOne({
          "content.text": COMMON_API,
          source_type: 'movie'
        }, {
          sub_comments: [  subCommentId]
        }),
        movieDatabase.updateOne({
          name: COMMON_API
        }, {
          comment: [ commentId ]
        })

      ])
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
      userDatabase.deleteOne({
        username: COMMON_API
      }),
      imageDatabase.deleteOne({
        src: COMMON_API
      }),
      videoDatabase.deleteOne({
        src: COMMON_API
      }),
      CommentModel.deleteMany({
        "content.text": COMMON_API
      }),
      movieDatabase.deleteOne({
        name: COMMON_API
      })
    ])
    .then(_ => {
      done()
    })
    .catch(err => {
      console.log('oops: ', err)
    })

  })

  describe(`pre check the params -> ${COMMON_API}`, function() {

    describe(`pre check the params fail test -> ${COMMON_API}`, function() {

      const baseContent = {
        text: COMMON_API,
        image: [ imageId.toString() ],
        video: [ videoId.toString() ]
      }

      const movie = movieId.toString()
      const comment = commentId.toString()

      it(`pre check the params fail because the movie id is not verify`, function(done) {

        Request
        .post(`${COMMON_API}/movie`)
        .send({
          content: baseContent,
          _id: movie.slice(1)
        })
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(400)
        .expect({
          'Content-Type': /json/,
        })
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

      it(`pre check the params fail because the movie id is not found`, function(done) {

        Request
        .post(`${COMMON_API}/movie`)
        .send({
          content: baseContent,
          _id: `${(parseInt(movie.slice(0, 1)) + 5) % 10}${movie.slice(1)}`
        })
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(404)
        .expect({
          'Content-Type': /json/,
        })
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

      it(`pre check the params fail because the comment id is not verify`, function(done) {

        Request
        .post(COMMON_API)
        .send({
          content: baseContent,
          _id: comment.slice(1)
        })
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(400)
        .expect({
          'Content-Type': /json/,
        })
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

      it(`pre check the params fail because the comment id is not found`, function(done) {

        Request
        .post(COMMON_API)
        .send({
          content: baseContent,
          _id: `${(parseInt(comment.slice(0, 1)) + 5) % 10}${comment.slice(1)}`
        })
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(404)
        .expect({
          'Content-Type': /json/,
        })
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

      it(`pre check the params fail becuase the image id is not verify`, function(done) {

        Request
        .post(COMMON_API)
        .send({
          _id: commentId.toString(),
          content: {
            ...baseContent,
            image: [ imageId.toString().slice(1) ]
          }
        })
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(400)
        .expect({
          'Content-Type': /json/,
        })
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

      it(`pre check the params fail becuase the image id is not found`, function(done) {

        const id = imageId.toString()

        Request
        .post(COMMON_API)
        .send({
          _id: commentId.toString(),
          content: {
            ...baseContent,
            image: [ `${(parseInt(id.slice(0, 1)) % 5) % 10}${id.slice(1)}` ]
          }
        })
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(404)
        .expect({
          'Content-Type': /json/,
        })
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

      it(`pre check the params fail becuase the video id is not verify`, function(done) {

        Request
        .post(COMMON_API)
        .send({
          _id: commentId.toString(),
          content: {
            ...baseContent,
            video: [ videoId.toString().slice(1) ]
          }
        })
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(400)
        .expect({
          'Content-Type': /json/,
        })
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

      it(`pre check the params fail becuase the video id is not found`, function(done) {

        const id = videoId.toString()

        Request
        .post(COMMON_API)
        .send({
          _id: commentId.toString(),
          content: {
            ...baseContent,
            video: [ `${(parseInt(id.slice(0, 1)) + 5) % 10}${id.slice(1)}` ]
          }
        })
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(404)
        .expect({
          'Content-Type': /json/,
        })
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

    })

  })

  describe(`get the movie comment list with self info test -> ${COMMON_API}`, function() {

    describe(`get the movie comment list with self info success test -> ${COMMON_API}`, function() {

      it(`get the movie comment list success`, function(done) {

        Request
        .get(COMMON_API)
        .query({
          _id: movieId.toString()
        })
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(200)
        .expect({
          'Content-Type': /json/,
        })
        .end(function(err, _) {
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

      it(`get the movie comment list success and return the status of 304`, function(done) {

        const query = {
          _id: movieId.toString()
        }

        Request
        .get(COMMON_API)
        .query(query)
        .set({
          Accept: 'Application/json',
          'If-Modified-Since': result.updatedAt,
          'If-None-Match': createEtag(query),
          Authorization: `Basic ${selfToken}`
        })
        .expect(304)
        .expect({
          'Content-Type': /json/,
          'Last-Modified': result.updatedAt,
          'ETag': createEtag(query)
        })
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

      it(`get the movie comment list success and hope return the status of 304 but the content has edited`, function(done) {

        const query = {
          _id: movieId.toString()
        }

        Request
        .get(COMMON_API)
        .query(query)
        .set({
          Accept: 'Application/json',
          'If-Modified-Since': new Date(Day(result.updatedAt).valueOf - 10000000),
          'If-None-Match': createEtag(query),
          Authorization: `Basic ${selfToken}`
        })
        .expect(200)
        .expect({
          'Content-Type': /json/,
          'Last-Modified': result.updatedAt,
          'ETag': createEtag(query)
        })
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

      it(`get the movie comment list success and hope return the status of 304 but the params of query is change`, function(done) {

        const query = {
          currPage: 0,
          _id: moveId.toString()
        }

        Request
        .get(COMMON_API)
        .query({
          _id: moveId.toString()
        })
        .set({
          Accept: 'Application/json',
          'If-Modified-Since': new Date(Day(result.updatedAt).valueOf - 10000000),
          'If-None-Match': createEtag(query),
          Authorization: `Basic ${selfToken}`
        })
        .expect(200)
        .expect({
          'Content-Type': /json/,
          'Last-Modified': result.updatedAt,
          'ETag': createEtag(query)
        })
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

    })

  })

  describe(`post the comment for movie test -> ${COMMON_API}`, function() {

    describe(`post the comment for movie success test -> ${COMMON_API}`, function() {

      const comment = {
        _id: movieId.toString(),
        content: {
          text: `${COMMON_API}/movie-test`,
          image: [ imageId.toString() ],
          video: [ videoId.toString() ]
        }
      }

      after(function(done) {

        CommentModel.findOne({
          "content.text": comment.content.text
        })
        .select({
          content: 1,
          source: 1
        })
        .exec()
        .then(data => !!data && data._doc)
        .then(data => {
          expect(data).to.be.not.a('boolean')
          const { content={}, source } = data | {}

          expect(source).to.be.satisfies(function(target) {
            return !!target && target.toString() == movieId.toString()
          })

          expect(content).to.be.a('object').and.that.include.all.keys('text', 'image', 'video')

          done()

        })
        .catch(err => {
          console.log('oops: ', err)
        })

      })

      it(`post the comment for movie success`, function(done) {

        Request
        .post(`${COMMON_API}/movie`)
        .send({
          ...comment
        })
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(200)
        .expect({
          'Content-Type': /json/,
        })
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

    })

  })

  describe(`post the comment for user test -> ${COMMON_API}`, function() {

    describe(`post the comment for user success test -> ${COMMON_API}`, function() {

      const comment = {
        _id: commentId.toString(),
        content: {
          text: `${COMMON_API}-test`,
          image: [ imageId.toString() ],
          video: [ videoId.toString() ]
        }
      }

      after(function(done) {

        CommentModel.findOne({
          "content.text": comment.content.text
        })
        .select({
          content: 1,
          source: 1
        })
        .exec()
        .then(data => !!data && data._doc)
        .then(data => {
          expect(data).to.be.not.a('boolean')
          const { content={}, source } = data | {}

          expect(source).to.be.satisfies(function(target) {
            return !!target && target.toString() == movieId.toString()
          })

          expect(content).to.be.a('object').and.that.include.all.keys('text', 'image', 'video')

          done()

        })
        .catch(err => {
          console.log('oops: ', err)
        })

      })

      it(`post the comment for user success`, function(done) {
        
        Request
        .post(COMMON_API)
        .send({
          ...comment
        })
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(200)
        .expect({
          'Content-Type': /json/,
        })
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

    })

  })

})