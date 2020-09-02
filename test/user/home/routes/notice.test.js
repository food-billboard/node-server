require('module-alias/register')
const { mockCreateGlobal, Request } = require('@test/utils')
const mongoose = require('mongoose')
const { Types: { ObjectId } } = mongoose

const COMMON_API = '/api/user/home/notice'

function responseExpect(res, validate=[]) {

  const { res: { data: target } } = res

  expect(target).to.be.a('object').and.includes.all.keys('_id', 'notice')
  expect(target._id).to.be.string.and.to.satisfy(function(target) {
    return ObjectId.isValid(target)
  })
  expect(target.notice).to.be.string.and.that.lengthOf.above(0)

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

    let database
    let result

    before(function(done) {
      const { model } = mockCreateGlobal({
        notice: COMMON_API
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

      it(`get home notice info success and return the status of 304`, function(done) {

        Request
        .get(COMMON_API)
        .set({
          Accept: 'Application/json',
          'If-Modified-Since': result.updatedAt
        })
        .expect(304)
        .expect({
          'Content-Type': /json/,
          'Last-Modified': result.updatedAt
        })
        .end(function(err, res) {
          if(err) return done(err)
          done()
        })

      })

    })

  })

})