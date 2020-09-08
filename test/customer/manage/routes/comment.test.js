require('module-alias/register')
const { expect } = require('chai')
const { mockCreateUser, mockCreateImage, mockCreateVideo, mockCreateComment, Request, createEtag, commonValidate } = require('@test/utils')

const COMMON_API = '/api/customer/manage/comment'

function responseExpect(res, validate=[]) {

  const { res: { data: target } } = res

  expect(target).to.be.a('object').and.that.includes.all.keys('comment')

  target.comment.forEach(item => {

    expect(item).to.be.a('object').and.that.includes.all.keys(
      'comment_users', 'content', 'createdAt', 'updatedAt', 'like', 'total_like',
      '_id', 'source', 'source_type', 'user_info'
    )

    commonValidate.number(item.comment_users)
    expect(item.content).to.be.have.a.property('content').that.is.a('object').and.includes.all.keys('text', 'image', 'video')
    commonValidate.string(item.content.text, function(target) { return true })
    item.content.image.forEach(item => commonValidate.poster(item))
    item.content.video.forEach(item => commonValidate.poster(item))

    commonValidate.time(item.createdAt)
    commonValidate.time(item.updatedAt)
    expect(item.like).to.be.a('boolean')
    commonValidate.number(item.total_like)
    commonValidate.objectId(item._id)
    
    expect(item.source).to.be.a('object').and.includes.all.keys('_id', 'content')
    commonValidate.objectId(item.source._id)

    commonValidate.string(item.source_type, function(target) {
      return !!~['movie', 'user'].indexOf(target.toLowerCase())
    })

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

  let userDatabase
  let commentDatabase
  let imageDatabase
  let videoDatabase
  let userId
  let selfToken
  let imageId
  let videoId
  let result

  before(function(done) {

    const { model: video } = mockCreateVideo({
      src: COMMON_API
    })
    const { model: image } = mockCreateImage({
      src: COMMON_API
    })
    const { model: user, token } = mockCreateUser({
      username: COMMON_API
    })

    imageDatabase = image
    videoDatabase = video
    userDatabase = user
    selfToken = token

    Promise.all([
      imageDatabase.save(),
      videoDatabase.save(),
      userDatabase.save()
    ])
    .then(([image, video, user]) => {
      imageId = image._id
      videoId = video._id
      userId = user._id
      const { model } = mockCreateComment({
        content: {
          text: COMMON_API,
          image: [ imageId ],
          video: [ videoId ]
        },
        source_type: 'user',
        source: userId,
        like_person: [ userId ]
      })

      commentDatabase = model
      return commentDatabase.save()
    })
    .then(data => {
      result = data
      return userDatabase.updateOne({
        _id: userId
      }, {
        comment: [ data._id ]
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
      commentDatabase.deleteOne({
        _id: result._id
      }),
      userDatabase.deleteOne({
        username: COMMON_API
      })
    ])
    .then(function() {
      done()
    })
    .catch(err => {
      console.log('oops: ', err)
    })

  })

  describe(`get self comment success test -> ${COMMON_API}`, function() {
    
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

    it(`get self comment success and return the status of 304`, function(done) {

      Request
      .get(COMMON_API)
      .set({
        Accept: 'Application/json',
        'If-Modified-Since': result.updatedAt,
        'If-None-Match': createEtag({}),
        Authorization: `Basic ${selfToken}`
      })
      .expect(304)
      .expect({
        'Content-Type': /json/,
        'Last-Modified': result.updatedAt,
        'ETag': createEtag({})
      })
      .end(function(err, _) {
        if(err) return done(err)
        done()
      })

    })

    it(`get self comment success and hope return the status of 304 but the content has edited`, function(done) {

      Request
      .get(COMMON_API)
      .set({
        Accept: 'Application/json',
        'If-Modified-Since': new Date(Day(result.updatedAt).valueOf - 10000000),
        'If-None-Match': createEtag({}),
        Authorization: `Basic ${selfToken}`
      })
      .expect(200)
      .expect({
        'Content-Type': /json/,
        'Last-Modified': result.updatedAt,
        'ETag': createEtag({})
      })
      .end(function(err, _) {
        if(err) return done(err)
        done()
      })

    })

    it(`get self comment success and hope return the status of 304 but the params of query is change`, function(done) {

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