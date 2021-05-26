require('module-alias/register')
const { mockCreateGlobal, Request, createEtag, commonValidate } = require('@test/utils')
const { GlobalModel } = require('@src/utils')
const { expect } = require('chai')

const COMMON_API = '/api/user/home/notice'

function responseExpect(res, validate=[]) {

  const { res: { data: target } } = res

  expect(target).to.be.a('object').and.includes.all.keys('_id', 'notice')
  commonValidate.objectId(target._id)
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

  describe(`get home notice info test -> ${COMMON_API}`, function() {

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
        console.log('oops: ', err)
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
        console.log('oops: ', err)
      })
    })

    describe(`get home notice info success test -> ${COMMON_API}`, function() {

      it(`get home notice info success`, function(done) {

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
            console.log(_)
          }
          responseExpect(obj)
          done()
        })
      })

      it.skip(`get home notice info success and return the status of 304`, function(done) {

        Request
        .get(COMMON_API)
        .set({
          Accept: 'Application/json',
          'If-Modified-Since': result.updatedAt,
          'If-None-Match': createEtag({})
        })
        .expect(304)
        .expect('Last-Modified', result.updatedAt.toString())
        .expect('ETag', createEtag({}))
        .end(function(err, res) {
          if(err) return done(err)
          done()
        })

      })

    })

  })

})