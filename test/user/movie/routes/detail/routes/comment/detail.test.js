require('module-alias/register')
const { expect } = require('chai')
const { 
  mockCreateImage, 
  Request, 
  mockCreateUser,
  mockCreateVideo,
  commonValidate,
} = require('@test/utils')
const { CommentModel } = require('@src/utils')

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
    commonValidate.number(comment_users)
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

  describe(`get the comment detail without self info test -> ${COMMON_API}`, function() {

    let imageDatabase
    let videoDatabase
    let userDatabase
    let commentDatabase
    let commentTestDatabase
    let imageId
    let videoId
    let userId
    let result

    before(function(done) {

      const { model:image } = mockCreateImage({
        src: COMMON_API
      })
      imageDatabase = image
      imageDatabase.save()
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
        videoDatabase = video
        userDatabase = user
        return Promise.all([
          videoDatabase.save(),
          userDatabase.save()
        ])
      })
      .then(([video, user]) => {
        userId = user._id
        videoId = video._id
        const { model } = mockCreateComment({
          source_type: 'user',
          source: userId,
          user_info: userId,
          content: {
            text: COMMON_API,
            image: [ imageId ],
            video: [ videoId ]
          },
          like_person: [user._id],
          comment_users: [ user._id ]
        })
        commentDatabase = model
        return commentDatabase.save()
      })
      .then(data => {
        result = data
        const { model } = mockCreateComment({
          source_type: 'user',
          source: userId,
          user_info: userId,
          content: {
            text: `${COMMON_API}-test`,
            image: [ imageId ],
            video: [ videoId ]
          },
        })
        commentTestDatabase = model
        return commentTestDatabase.save()
      })
      .then(function(data) {
        return commentDatabase.updateOne({
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
        imageDatabase.deleteOne({
          src: COMMON_API
        }),
        videoDatabase.deleteOne({
          src: COMMON_API
        }),
        userDatabase.deleteOne({
          username: COMMON_API
        }),
        CommentModel.deleteMany({
          "content.image": [imageId]
        }),
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
          _id: result._id.toString()
        })
        .set({
          Accept: 'Application/json',
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

      it(`get the comment detail without self info success and return the status of 304`, function(done) {

        const query = {
          _id: result._id.toString()
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

      it(`get the comment detail without self info success and hope return the status of 304 but the content has edited`, function(done) {

        const query = {
          _id: result._id.toString()
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

      it(`get the comment detail without self info success and hope return the status of 304 but the params of query is change`, function(done) {

        const query = {
          offset: 0,
          _id: result._id.toString()
        }

        Request
        .get(COMMON_API)
        .query({
          _id: result._id.toString()
        })
        .set({
          Accept: 'Application/json',
          'If-Modified-Since': new Date(Day(result.updatedAt).valueOf - 10000000),
          'If-None-Match': createEtag(query)
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

    describe(`get the comment detail without self info fail test -> ${COMMON_API}`, function() {

      it(`get the comment detail without self info fail because the comment id is not found`, function(done) {

        const _id = result._id.toString()

        Request
        .get(COMMON_API)
        .query({
          _id: `${(parseInt(_id.slice(0, 1)) + 5) % 10}${_id.slice(1)}`
        })
        .set({
          Accept: 'Application/json'
        })
        .expect(404)
        .expect({
          'Content-Type': /json/
        })
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

      it(`get the comment detail without self info fail because the comment id is not verify`, function(done) {

        Request
        .get(COMMON_API)
        .query({
          _id: result._id.slice(1)
        })
        .set({
          Accept: 'Application/json'
        })
        .expect(400)
        .expect({
          'Content-Type': /json/
        })
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
        .expect({
          'Content-Type': /json/
        })
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

    })

  })

})