require('module-alias/register')
const App = require('../app')
const { expect } = require('chai')
const { mockCreateUser, Request } = require('@test/utils')
const mongoose = require("mongoose")
const { Types: { ObjectId } } = mongoose

const COMMON_API = '/api/user/customer'

function responseExpect(res, validate=[]) {

  const { target } = res
  // "attentions": 0,
  // "avatar": "string",
  // "createdAt": 1234567890,
  // "updatedAt": 123456789,
  // "fans": 0,
  // "hot": 0,
  // "username": "string",
  // "_id": "string",
  expect(target).to.be.a('object').and.include.all.keys('attentions', 'avatar', 'fans', 'hot', 'username', '_id')
  expect(target).to.have.property('attentions')

  if(Array.isArray(validate)) {
    validate.forEach(valid => {
      typeof valid == 'function' && valid(target)
    })
  }else if(typeof validate == 'function') {
    validate(target)
  }
}

describe(`${COMMON_API} test`, function() {

  describe(`get another userinfo and not self and without self info test -> ${COMMON_API}`, function() {

    let database
    let result

    before(function(done) {
      const { model } = mockCreateUser({
        username: '测试名字'
      })
      database = model
      database.save()
      .then(function(data) {
        result = data
        done()
      })
      .catch(err => {
        console.log('oops: ', err)
      })
    })

    after(function(done) {
      database.deleteOne({
        username: '测试名字'
      })
      .then(function() {
        done()
      })
    })

    describe(`get another userinfo and not self and without self info success test -> ${COMMON_API}`, function() {

      it(`get another userinfo and not self and without self info success`, function() {

        Request
        .get(COMMON_API)
        .query({ _id: result._id.toString() })
        .set('Accept', 'application/json')
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if(err) return done(err)
          responseExpect(res)
          done()
        })

      })

    })

    describe(`get another userinfo and not self and without self info fail test -> ${COMMON_API}`, function() {
      
      it(`get another userinfo and not self and without self info fail because of the movie id is not found or verify`, function() {
        
      })

    })

  })

})
