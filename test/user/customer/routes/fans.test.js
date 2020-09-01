require('module-alias/register')
const { mockCreateUser, Request } = require('@test/utils')
const { expect } = require('chai')
const mongoose = require('mongoose')
const { Types: { ObjectId } } = mongoose

const COMMON_API = '/api/user/customer/fans'

function responseExpect(res, validate=[]) {

  const { res: { data: target } } = res

  expect(target).to.be.a('array')
  target.forEach(item => {
    expect(item).to.be.a('object').and.includes.all.keys('avatar', 'username', '_id')
    //avatar
    expect(item).to.have.a.property('avatar').and.satisfy(function(target) {
      return target == null ? true : typeof target === 'string'
    })
    //username
    expect(item).to.have.a.property('username').and.is.a('string')
    //_id
    expect(item).to.have.a.property('_id').and.is.a('string').that.satisfy(function(target) {
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

  describe(`get another user fans test -> ${COMMON_API}`, function() {

    let database
    let fansId
    let result

    before(function(done) {

      const { model } = mockCreateUser({
        username: '关注用户测试名字',
        mobile: 11256981236
      })
      model.save()
      .then(function(data) {
        const { _id } = data
        fansId = _id
        const { model } = mockCreateUser({
          username: '测试名字',
          attentions: [
            _id
          ]
        })
        database = model
        return database.save()
      })
      .then(function(data) {
        result = data
        done()
      })
      .catch(err => {
        console.log('oops: ', err)
      })
    })

    after(function(done) {
      database.deleteMany({
        _id: { $in: [ fansId, result._id ] }
      })
      .then(function() {
        done()
      })
    })

    describe(`get another user fans success test -> ${COMMON_API}`, function() {

      it(`get another user fans success`, function(done) {

        Request
        .get(COMMON_API)
        .query({ _id: result._id.toString() })
        .set('Accept', 'Appication/json')
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

      it(`get another user fans and return the status of 304`, function(done) {
        
        Request
        .get(COMMON_API)
        .query({ _id: result._id.toString() })
        .set('Accept', 'Appication/json')
        .set('If-Modified-Since', result.updatedAt)
        .expect(304)
        .expect('Content-Type', /json/)
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

    })

    describe(`get another user fans fail test -> ${COMMON_API}`, function() {
      
      it(`get another user fans because the user id is not found`, function() {
        
        const errorId = result._id.toString()

        Request
        .get(COMMON_API)
        .query({ _id: `${(parseInt(errorId.slice(0, 1)) + 5) % 10}${errorId.slice(1)}` })
        .set('Accept', 'Appication/json')
        .expect(404)
        .expect('Content-Type', /json/)
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

      it(`get another user fans because the user id is not verify`, function() {

        Request
        .get(COMMON_API)
        .query({ _id: result._id.toString().slice(1) })
        .set('Accept', 'Appication/json')
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