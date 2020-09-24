require('module-alias/register')
const { expect } = require('chai')
const { mockCreateUser, Request, createEtag } = require('@test/utils')
const { UserModel } = require('@src/utils')
const mongoose = require('mongoose')
const { Types: { ObjectId } } = mongoose

const COMMON_API = '/api/user/customer/attention'

function responseExpect(res, validate=[]) {

  const { res: { data: target } } = res

  expect(target).to.be.a('object').and.that.includes.all.keys('attentions')
  expect(target.attentions).to.be.a('array')
  target.attentions.forEach(item => {
    expect(item).to.be.a('object').and.includes.all.keys('avatar', 'username', '_id')
    //avatar
    expect(item).to.have.a.property('avatar').and.satisfy(function(target) {
      return target == null ? true : ObjectId.isValid(target)
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

  describe(`get another user attention test -> ${COMMON_API}`, function() {

    let attentionId
    let result

    before(function(done) {

      const { model } = mockCreateUser({
        username: COMMON_API,
        mobile: 11256981236
      })
      model.save()
      .then(function(data) {
        const { _id } = data
        attentionId = _id
        const { model } = mockCreateUser({
          username: COMMON_API,
          attentions: [
            _id
          ]
        })

        return model.save()
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
      UserModel.deleteMany({
        _id: { $in: [ attentionId, result._id ] },
        username: COMMON_API
      })
      .then(function() {
        done()
      })
    })

    describe(`get another user attention success test -> ${COMMON_API}`, function() {

      it(`get another user attention success`, function(done) { 

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

      it(`get another user attention success and return the status of 304`, function(done) {

        const query = {
          _id: result._id.toString()
        }

        Request
        .get(COMMON_API)
        .query(query)
        .set('Accept', 'application/json')
        .set('If-Modified-Since', result.updatedAt)
        .set('If-None-Match', createEtag(query))
        .expect(304)
        .expect('Last-Modified', result.updatedAt.toString())
        .expect('ETag', createEtag(query))
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

    })

    describe(`get another user attention fail test -> ${COMMON_API}`, function() {
      
      it(`get another user attention fail because the user id is not found`, function(done) {

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

      it(`get another user attention fail because the user id is not verify`, function(done) {

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