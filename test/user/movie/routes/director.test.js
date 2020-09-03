require('module-alias/register')
const { expect } = require('chai')
const { mockCreateDirector, Request, commonValidate } = require('@test/utils')

const COMMON_API = '/api/user/movie/director'

function responseExpect(res, validate=[]) {

  const { res: { data: target } } = res 

  expect(target).to.be.a('array')
  target.forEach(item => {
    expect(item).to.be.a('object').and.that.includes.all.keys('name', '_id')
    commonValidate.string(item.name)
    commonValidate.objectId(item._id)
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

  describe(`get director list test -> ${COMMON_API}`, function() {
    
    describe(`get director list success test -> ${COMMON_API}`, function() {

      let database
      let result
  
      before(function(done) {
        const { model } = mockCreateDirector({
          name: COMMON_API
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
          name: COMMON_API
        })
        .then(function() {
          done()
        })
        .catch(err => {
          console.log('oops: ', err)
        })
      })

      it(`get director list success`, function(done) {

        Request
        .get(COMMON_API)
        .query(count, 10)
        .set({
          Accept: 'Application/json'
        })
        .expect(200)
        .expect({ 'Content-Type': /json/ })
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

      it(`get director list success and return the status of 304`, function(done) {

        const query = {
          count: 10
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

      it(`get director list success and hope return the status of 304 but the content has edited`, function(done) {

        const query = {
          count: 10
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

      it(`get director list success and hope return the status of 304 but the params of query is change`, function(done) {

        const query = {
          count: 10
        }

        Request
        .get(COMMON_API)
        .query({
          count: 10
        })
        .set({
          Accept: 'Application/json',
          'If-Modified-Since': new Date(Day(result.updatedAt).valueOf - 10000000),
          'If-None-Match': createEtag({
            count:9
          })
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

    describe(`get director list fail test -> ${COMMON_API}`, function(){

      it(`get director list fail because the list's length is 0`, function(done) {

        Request
        .get(COMMON_API)
        .query({ count: 10 })
        .set('Accept', 'Application/json')
        .expect(404)
        .expect('Content-Type', /json/)
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

    })

  })

})