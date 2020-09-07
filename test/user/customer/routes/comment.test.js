require('module-alias/register')
const { mockCreateUser, mockCreateComment, Request, createEtag } = require('@test/utils')
const { expect } = require('chai')
const mongoose = require('mongoose')
const { Types: { ObjectId } } = mongoose

const COMMON_API = '/api/user/customer/comment'

function responseExpect(res, validate=[]) {

  const { res: { data: target } } = res

  expect(target).to.be.includes.all.keys('user_info', 'data')
  //user_info
  expect(target.user_info).is.a('object').and.to.be.includes.all.keys('avatar', '_id', 'username')
  expect(target.user_info).to.have.a.property('avatar').that.satisfies(function(target) {
    return target == null ? true : typeof target === 'string'
  })
  expect(target.user_info).to.have.a.property('_id').that.is.a('string')
  expect(target.user_info).to.have.a.property('username').that.is.a('string')
  //data
  expect(target.data).is.a('array')
  target.data.forEach((item) => {
    expect(item).is.a('object').that.includes.all.keys('content', 'createdAt', 'source', 'total_like', '_id')
    //content
    expect(item).to.be.have.a.property('content').that.is.a('object').and.includes.all.keys('text', 'image', 'video')
    expect(item.content).to.have.a.property('text').that.is.a('string')
    expect(item.content).to.have.a.property('image').that.is.a('array')
    expect(item.content).to.have.a.property('video').that.is.a('array')
    expect(item.content.image.every(media => typeof media === 'string')).to.be.true
    expect(item.content.video.every(media => typeof media === 'string')).to.be.true
    //createdAt
    expect(item).have.a.property('createdAt').that.is.a('date')
    //source
    expect(item).have.a.property('source').that.is.a('object').and.includes.all.keys('type', 'comment', 'content')
    expect(item.source).have.a.property('comment').that.is.a('string')
    expect(item.source.comment).to.be.satisfies(function(target) {
      return ObjectId.isValid(target)
    })
    expect(item.source).have.a.property('type').is.a('string').and.satisfies(function(target) {
      return !!~['movie', 'user'].indexOf(target.toLowerCase())
    })
    expect(item.source).have.a.property('content').satisfies(function(target) {
      return item.source.type.toLowerCase() == 'movie' ? target == null : typeof target === 'string'
    })
    //total_like
    expect(item).to.have.a.property('total_like').and.is.a('number')
    //_id
    expect(item).to.have.a.property('_id').and.is.a('string').that.satisfies(function(target) {
      return ObjectId.isValid(target)
    })
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

  describe(`get another user comment test -> ${COMMON_API}`, function() {

    let userDatabase
    let commentDatabase
    let originCommentDatabase
    let userResult

    before(function(done) {
      
      const { model } = mockCreateUser({
        username: '测试名字'
      })
      userDatabase = model
      userDatabase.save()
      .then(function(data) {
        userResult = data

        const { model } = mockCreateComment({
          source: ObjectId('56aa3554e90911b64c36a424'),
          user_info: userResult._id,
        })
        const { model: origin } = mockCreateComment({
          source: ObjectId('56aa3554e90911b64c36a424'),
          user_info: userResult._id,
          content: {
            text: COMMON_API
          }
        })
        commentDatabase = model
        originCommentDatabase = origin
        return Promise.all([
          commentDatabase.save(),
          originCommentDatabase.save()
        ])
      })
      .then(([comment, origin]) => {
        return Promise.all([
          userDatabase.updateOne({
            username: '测试名字'
          }, {
            $push: { comment: comment._id }
          }),
          commentDatabase.updateOne({
            user_info: userResult._id,
          }, {
            source: origin._id
          })
        ])
      })
      .then(function(_) {
        done()
      })
      .catch(err => {
        console.log('oops: ', err)
      })
    })

    after(function(done) {
      Promise.all([
        userDatabase.deleteOne({
          username: '测试名字'
        }),
        commentDatabase.deleteOne({
          source: ObjectId('56aa3554e90911b64c36a424'),
        })
      ])
      .then(function() {
        done()
      })
      .catch(err => {
        console.log('oops: ', err)
      })
    })

    describe(`get another user comment success test -> ${COMMON_API}`, function() {

      it(`get another user comment success`, function(done) {

        Request
        .get(COMMON_API)
        .set('Accept', 'application/json')
        .query({ _id: userResult._id.toString() })
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

      it(`get another user comment success and return the status of 304`, function(done) {

        const query = {
          _id: userResult._id.toString()
        }

        Request
        .get(COMMON_API)
        .query(query)
        .set({
          'Accept': 'Application/json',
          'If-Modified-Since': userResult.updatedAt,
          'If-None-Match': createEtag(query)
        })
        .expect(304)
        .expect('Content-Type', /json/)
        .expect('Last-Modidifed', userResult.updatedAt)
        .expect('ETag', createEtag(query))
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })
      })

    })

    describe(`get another user comment fail test -> ${COMMON_API}`, function() {
      
      it(`get another user comment fail because the user id is not found`, function(done) {

        const { _id } = userResult

        Request
        .get(COMMON_API)
        .query('_id', `${parseInt(_id.slice(0, 1) + 5) % 10}${_id.slice(1)}`)
        .set('Accept', 'Application/json')
        .expect(404)
        .expect('Content-Type', /json/)
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

      it(`get another user comment fail because the user id is not verify`, function(done) {
        
        Request
        .get(COMMON_API)
        .query('_id', userResult._id.slice(1))
        .set('Accept', 'Application/json')
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