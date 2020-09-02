require('module-alias/register')
const { expect } = require('chai')
const { mockCreateMovie, mockCreateImage, Request } = require('@test/utils')
const mongoose = require('mongoose')
const { Types: { ObjectId } } = mongoose

const COMMON_API = '/api/user/home/daily'

function responseExpect(res, validate=[]) {

  const { res: { data: target } } = res

  expect(target).to.be.a('array')
  target.forEach(item => {
    expect(item).to.be.a('object').and.includes.all.keys('name', 'poster', '_id')
    expect(item.name).to.be.string.and.that.lengthOf.above(0)
    expect(item.poster).to.be.satisfies(function(target) {
      return target == null ? true : typeof target === 'string'
    })
    expect(item._id).to.be.string.and.satisfies(function(target) {
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

  describe(`get home daily list test -> ${COMMON_API}`, function() {

    let imageDatabase
    let movieDatabase
    let result

    before(function(done) {
      const { model } = mockCreateImage({
        src: COMMON_API
      })
      imageDatabase = model
      imageDatabase.save()
      .then(function(data) {
        const { model } = mockCreateMovie({
          name: COMMON_API,
          poster: data._id
        })
        movieDatabase = model
        movieDatabase.save()
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
      Promise.all([
        imageDatabase.deleteOne({
          src: COMMON_API
        }),
        movieDatabase.deleteOne({
          name: COMMON_API
        })
      ])
      .then(function() {
        done()
      })
      .catch(err => {
        console.log('oops: ', err)
      })
    })

    describe(`get home daily list success test -> ${COMMON_API}`, function() {

      it(`get home daily list success`, function(done) {

        Request
        .get(COMMON_API)
        .query({ count: 12 })
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