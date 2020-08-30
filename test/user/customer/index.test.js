require('module-alias/register')
const App = require('../app')
const { expect } = require('chai')
const { mockCreateUser, Request } = require('@test/utils')
const mongoose = require("mongoose")
const { Types: { ObjectId } } = mongoose

const COMMON_API = '/api/user/customer'

function responseExpect(res, validate=[]) {

  const { target } = res
  expect(target).to.be.a('object').and.include.all.keys('attentions', 'avatar', 'fans', 'hot', 'username', '_id')
  expect(target).to.have.property('attentions').and.is.a('number').and.that.above(0)
  expect(target).to.have.property('avatar').and.is.a('string')
  expect(target).to.have.property('fans').and.is.a('number').and.that.above(0)
  expect(target).to.have.property('username').and.is.a('string')
  expect(target).to.have.property('_id').and.is.a('string')
  

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
      
      it(`get another userinfo and not self and without self info fail because of the movie id is not verify`, function() {
        
        const id = result._id.toString()

        Request
        .get(COMMON_API)
        .query({ _id: id.slice(1) })
        .set('Accept', 'application/json')
        .expect(400)
        .expect('Content-Type', /json/)
        .end(function() {
          done()
        })

      })

      it(`get another userinfo and not self and without self info fail because of the movie id is not found`, function() {
        
        const id = result._id.toString()

        Request
        .get(COMMON_API)
        .query({ _id: `${parseInt(id.slice(0, 1) + 1) % 10}${id.slice(1)}` })
        .set('Accept', 'application/json')
        .expect(404)
        .expect('Content-Type', /json/)
        .end(function() {
          done()
        })

      })

    })

  })

})
