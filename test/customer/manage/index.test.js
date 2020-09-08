require('module-alias/register')
const { expect } = require('chai')
const { mockCreateUser, Request, createEtag, commonValidate } = require('@test/utils')

const COMMON_API = '/api/customer/manage'

function responseExpect(res, validate=[]) {

  const { res: { data: target } } = res

  expect(target).to.be.a('object').and.include.all.keys('attentions', 'avatar', 'fans', 'hot', 'username', '_id', 'like', 'createdAt', 'updatedAt')
  commonValidate.number(target.attentions)
  commonValidate.poster(target.avatar)
  commonValidate.number(target.fans)
  commonValidate.string(target.username)
  commonValidate.objectId(target._id)
  commonValidate.time(target.createdAt)
  commonValidate.time(target.updatedAt)
  expect(target.like).to.be.a('boolean')

  if(Array.isArray(validate)) {
    validate.forEach(valid => {
      typeof valid == 'function' && valid(target)
    })
  }else if(typeof validate == 'function') {
    validate(target)
  }
}

describe(`${COMMON_API} test`, function() {

  let selfDatabase
  let result
  let selfToken

  before(function(done) {

    const { model:self, token } = mockCreateUser({
      username: COMMON_API,
      mobile: 15632558974
    })
    selfDatabase = self
    selfToken = token

    self.save()
    .then(self => {
      result = self
      done()
    })
    .catch(err => {
      console.log('oops: ', err)
    })

  })

  after(function(done) {

    selfDatabase.deleteOne({
      username: COMMON_API
    })
    .then(_ => {
      done()
    })
    .catch(err => {
      console.log('oops: ', err)
    })

  })

  describe(`pre check params test -> ${COMMON_API}`, function() {

    describe(`pre check params success test -> ${COMMON_API}`, function(done) {

      Request
      .get(COMMON_API)
      .set({
        Accept: 'application/json',
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

    describe(`pre check params fail test -> ${COMMON_API}`, function() {

      it(`pre check params fail because of the token is expired`, function(done) {

        this.timeout(11000)
        Request
        .get(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(401)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if(err) return done(err)
          done()
        })

      })

      it(`pre check params fail because of the token is not verify`, function(done) {

        Request
        .get(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken.slice(1)}`
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

      it(`pre check params fail because of the token is no found`, function(done) {

        Request
        .get(COMMON_API)
        .set({
          Accept: 'application/json',
        })
        .expect(401)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if(err) return done(err)
          done()
        })

      })

    })

  })

  describe(`get self userinfo test -> ${COMMON_API}`, function() {

    describe(`get self userinfo test success -> ${COMMON_API}`, function() {

      it(`get self userinfo test success and return the status of 304`, function(done) {

        Request
        .get(COMMON_API)
        .set({
          Accept: 'Application/json',
          'If-Modified-Since': result.updatedAt,
          'If-None-Match': createEtag({}),
          Authorization: `Basic ${selfToken.slice(1)}`
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

      it(`get self userinfo test success and hope return the status of 304 but the content has edited`, function(done) {


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

      it(`get self userinfo test success and hope return the status of 304 but the params of query is change`, function(done) {

        const query = {
          _id: result._id.toString()
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

    describe(`get self userinfo test fail -> ${COMMON_API}`, function() {

      afterEach(function(done) {
        selfDatabase.deleteOne({
          username: COMMON_API
        })
        .then(_ => {
          done()
        })
        .catch(err => {
          console.log('oops: ', err)
        })
      })

      it(`get self userinfo fail because of the database has not the user`, function(done) {
        
        Request
        .get(COMMON_API)
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

})
