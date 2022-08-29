require('module-alias/register')
const { expect } = require('chai')
const { mockCreateGlobal, Request, commonValidate } = require('@test/utils')
const { GlobalModel } = require('@src/utils')

const COMMON_API = '/api/user/setting/info/notice'

function responseExpect(res, validate=[]) {

  const { res: { data: target } } = res

  expect(target).to.be.a('object').and.that.includes.all.keys('notice')
  commonValidate.string(target.notice)

  if(Array.isArray(validate)) {
    validate.forEach(valid => {
      typeof valid == 'function' && valid(target)
    })
  }else if(typeof validate == 'function') {
    validate(target)
  }
}

describe(`${COMMON_API} test`, function() {

  describe(`get the mini app info notice test -> ${COMMON_API}`, function() {
    
    describe(`get the mini app info notice success test -> ${COMMON_API}`, function() {

      let result
  
      before(function(done) {
        const { model } = mockCreateGlobal({
          notice: COMMON_API
        })

        model.save()
        .then(function(data) {
          result = data
          done()
        })
        .catch(err => {
          done(err)
        })
      })
  
      after(function(done) {
        GlobalModel.deleteOne({
          notice: COMMON_API
        })
        .then(function() {
          done()
        })
        .catch(err => {
          done(err)
        })
      })

      it(`get the mini app info notice succcess`, function(done) {
        
        Request
        .get(COMMON_API)
        .set('Accept', 'Application/json')
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if(err) return done(err)
          const { res: { text } } = res
          let obj
          try{
            obj = JSON.parse(text)
          }catch(_) {
            
          }
          responseExpect(obj)
          done()
        })

      })

    })

    describe.skip(`get the mini app info notice success test -> ${COMMON_API}`, function() {

      it(`get the mini app info notice fail because the database is not found the data`, function(done) {

        Request
        .get(COMMON_API)
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