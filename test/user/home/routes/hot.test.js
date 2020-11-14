require('module-alias/register')
const { expect } = require('chai')
const { mockCreateMovie, Request, commonValidate } = require('@test/utils')
const { MovieModel } = require('@src/utils')

const COMMON_API = '/api/user/home/hot'

function responseExpect(res, validate=[]) {

  const { res: { data: target } } = res

  expect(target).to.be.a('array')
  target.forEach(item => {
    expect(item).to.be.a('object').and.includes.all.keys('name', '_id')
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

  describe(`get home hot list test -> ${COMMON_API}`, function() {

    before(function(done) {

      const { model } = mockCreateMovie({
        name: COMMON_API
      })

      model.save()
      .then(data => {
        done()
      })
      .catch(err => {
        console.log('oops: ', err)
      })

    })

    after(function(done) {

      MovieModel.deleteMany({
        name: COMMON_API
      })
      .then(function() {
        done()
      })
      .catch(err => {
        console.log('oops: ', err)
      })

    })

    describe(`get home hot list success test -> ${COMMON_API}`, function() {

      it(`get home hot list success`, function(done) {

        Request
        .get(COMMON_API)
        .query({ count: 3 })
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

    })

  })

})