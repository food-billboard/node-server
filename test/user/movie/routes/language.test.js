require('module-alias/register')
const { expect } = require('chai')
const { mockCreateLanguage, Request, commonValidate, createEtag } = require('@test/utils')
const { LanguageModel } = require('@src/utils')
const Day = require('dayjs')

const COMMON_API = '/api/user/movie/language'

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

  describe(`get language list test -> ${COMMON_API}`, function() {
    
    describe(`get language list success test -> ${COMMON_API}`, function() {
      
      let result
  
      before(function(done) {
        const { model } = mockCreateLanguage({
          name: COMMON_API
        })

        model.save()
        .then(function(data) {
          result = data
          done()
        })
        .catch(err => {
          console.log('oops: ', err)
        })
      })
  
      after(function(done) {
        
        LanguageModel.deleteOne({
          name: COMMON_API
        })
        .then(function() {
          done()
        })
        .catch(err => {
          console.log('oops: ', err)
        })

      })

      it(`get language list success`, function(done) {

        Request
        .get(COMMON_API)
        .query('count', 10)
        .set({
          Accept: 'Application/json'
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

      it(`get language list success and return the status of 304`, function(done) {

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
        .expect('Last-Modified', result.updatedAt.toString())
        .expect('ETag', createEtag(query))
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

      it(`get language list success and hope return the status of 304 but the content has edited`, function(done) {

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
        .expect('Last-Modified', result.updatedAt.toString())
        .expect('ETag', createEtag(query))
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

      it(`get language list success and hope return the status of 304 but the params of query is change`, function(done) {

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
        .expect('Last-Modified', result.updatedAt.toString())
        .expect('ETag', createEtag(query))
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

    })

    describe(`get language list fail test -> ${COMMON_API}`, function(){

      // it(`get language list fail because the list's length is 0`, function(done) {

      //   Request
      //   .get(COMMON_API)
      //   .query({ count: 10 })
      //   .set('Accept', 'Application/json')
      //   .expect(404)
      //   .expect('Content-Type', /json/)
      //   .end(function(err, _) {
      //     if(err) return done(err)
      //     done()
      //   })

      // })

    })

  })

})