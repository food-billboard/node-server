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
const { CommentModel, UserModel, ImageModel, VideoModel, MovieModel } = require('@src/utils')
const Day = require('dayjs')

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
    if(typeof comment_users === 'number') {
      commonValidate.number(comment_users)
    }else {
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
      expect(item).to.be.a('object').that.includes.any.keys('src', 'poster')
      const { poster, src } = item 
      commonValidate.string(src)
      commonValidate.poster(poster)
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
  let result
  let getToken

  before(async function() {

    const { model: image } = mockCreateImage({
      src: COMMON_API,
    })

    imageDatabase = image

    await imageDatabase.save()
    .then(data => {
      imageId = data._id

      const { model: video } = mockCreateVideo({
        src: COMMON_API,
        poster: imageId
      })
      const { model: user, signToken } = mockCreateUser({
        username: COMMON_API,
        avatar: imageId,
      })
      
      getToken = signToken
      videoDatabase = video
      userDatabase = user

      return Promise.all([
        videoDatabase.save(),
        userDatabase.save()
      ])
    })
    .then(([video, user]) => {
      videoId = video._id
      userId = user._id
      selfToken = getToken(userId)
      const { model: movie } = mockCreateMovie({
        name: COMMON_API,
        author: userId,
        source_type: 'USER',
        status: 'COMPLETE',
      })

      movieDatabase = movie

      return movieDatabase.save()

    })
    .then(data => {
      movieId = data._id
      result = data
      const { model: comment } = mockCreateComment({
        content: {
          text: COMMON_API,
          video: [ videoId ],
          image: [ imageId ]
        },
        source_type: 'movie',
        source: movieId,
        comment_users: [ userId ],
        sub_comments: [],
        user_info: userId,
        like_person: [
          userId 
        ]
      })

      commentDatabase = comment

      return commentDatabase.save()

    })
    .then(comment => {
      commentId = comment._id
      const { model: subComment } = mockCreateComment({
        content: {
          text: COMMON_API,
          video: [ videoId ],
          image: [ imageId ]
        },
        source_type: 'comment',
        source: commentId,
      })
      subCommentDatabase = subComment

      return subCommentDatabase.save()

    })
    .then(data => {
      subCommentId = data._id
      return Promise.all([

        commentDatabase.updateOne({
          "content.text": COMMON_API,
          source_type: 'movie'
        }, {
          $set: {
            sub_comments: [ subCommentId ]
          }
        }),
        movieDatabase.updateOne({
          name: COMMON_API
        }, {
          $set: {
            comment: [ commentId ]
          }
        })

      ])
    })
    .catch(err => {
      console.log('oops: ', err)
    })

    return Promise.resolve()

  })

  after(async function() {

    await Promise.all([
      UserModel.deleteOne({
        username: COMMON_API
      }),
      ImageModel.deleteOne({
        src: COMMON_API
      }),
      VideoModel.deleteOne({
        src: COMMON_API
      }),
      CommentModel.deleteMany({
        $or: [
          {
            "content.text": COMMON_API
          },
          {
            "content.text": `${COMMON_API}/movie-test`
          },
          {
            "content.text": `${COMMON_API}-test`
          }
        ]
      }),
      MovieModel.deleteOne({
        name: COMMON_API
      })
    ])
    .catch(err => {
      console.log('oops: ', err)
    })

    return Promise.resolve()

  })

  describe(`pre check the params -> ${COMMON_API}`, function() {

    describe(`pre check the params fail test -> ${COMMON_API}`, function() {

      let baseContent, movie, comment

      before(function(done) {
        baseContent = {
          text: COMMON_API,
          image: [ imageId.toString() ],
          video: [ videoId.toString() ]
        }
  
        movie = movieId.toString()
        comment = commentId.toString()
        done()
      })

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
        .expect('Content-Type', /json/)
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
        .expect('Content-Type', /json/)
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
        .expect('Content-Type', /json/)
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
        .expect('Content-Type', /json/)
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
        .expect('Content-Type', /json/)
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
        .expect('Content-Type', /json/)
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
        .expect('Content-Type', /json/)
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
        .expect('Content-Type', /json/)
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

    })

  })

  describe(`get the movie comment list with self info test -> ${COMMON_API}`, function() {

    describe(`get the movie comment list with self info success test -> ${COMMON_API}`, function() {

      beforeEach(async function() {

        updatedAt = await MovieModel.findOne({
          name: COMMON_API,   
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

      it.skip(`get the movie comment list success and return the status of 304`, function(done) {

        const query = {
          _id: movieId.toString()
        }

        Request
        .get(COMMON_API)
        .query(query)
        .set({
          Accept: 'Application/json',
          'If-Modified-Since': updatedAt,
          'If-None-Match': createEtag(query),
          Authorization: `Basic ${selfToken}`
        })
        .expect(304)
        .expect('Last-Modified', updatedAt.toString())
        .expect('ETag', createEtag(query))
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

      it.skip(`get the movie comment list success and hope return the status of 304 but the content has edited`, function(done) {

        const query = {
          _id: movieId.toString()
        }

        Request
        .get(COMMON_API)
        .query(query)
        .set({
          Accept: 'Application/json',
          'If-Modified-Since': new Date(Day(updatedAt).valueOf - 10000000),
          'If-None-Match': createEtag(query),
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

      it.skip(`get the movie comment list success and hope return the status of 304 but the params of query is change`, function(done) {

        const query = {
          currPage: 0,
          _id: movieId.toString()
        }

        Request
        .get(COMMON_API)
        .query({
          _id: movieId.toString()
        })
        .set({
          Accept: 'Application/json',
          'If-Modified-Since': updatedAt,
          'If-None-Match': createEtag(query),
          Authorization: `Basic ${selfToken}`
        })
        .expect(200)
        .expect('Last-Modified', updatedAt.toString())
        .expect('ETag', createEtag({
          _id: movieId.toString()
        }))
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

    })

  })

  describe(`post the comment for movie test -> ${COMMON_API}`, function() {

    describe(`post the comment for movie success test -> ${COMMON_API}`, function() {

      let comment
      
      before(function(done) {

        comment = {
          _id: movieId.toString(),
          content: {
            text: `${COMMON_API}/movie-test`,
            image: [ imageId.toString() ],
            video: [ videoId.toString() ]
          }
        }

        done()

      })

      after(async function() {

        await CommentModel.findOne({
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

          const { content={}, source } = data || {}

          expect(source).to.be.satisfies(function(target) {
            return !!target && target.toString() == movieId.toString()
          })

          expect(content).to.be.a('object').and.that.include.all.keys('text', 'image', 'video')

        })
        .catch(err => {
          console.log('oops: ', err)
        })

        return Promise.resolve()

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
        .expect('Content-Type', /json/)
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

    })

  })

  describe(`post the comment for user test -> ${COMMON_API}`, function() {

    describe(`post the comment for user success test -> ${COMMON_API}`, function() {

      let comment

      before(function(done) {
        comment = {
          _id: commentId.toString(),
          content: {
            text: `${COMMON_API}-test`,
            image: [ imageId.toString() ],
            video: [ videoId.toString() ]
          }
        }
        done()
      })

      after(async function() {

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
          const { content={}, source } = data || {}

          expect(source.toString()).to.be.equal(commentId.toString())

          expect(content).to.be.a('object').and.that.include.all.keys('text', 'image', 'video')

        })
        .catch(err => {
          console.log('oops: ', err)
        })

        return Promise.resolve()

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
        .expect('Content-Type', /json/)
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

    })

  })

})