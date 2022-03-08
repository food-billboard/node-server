require('module-alias/register')
const { UserModel, getClient } = require('@src/utils')
const { expect } = require('chai')
const { nanoid } = require('nanoid')
const { Request, commonValidate, mockCreateUser, parseResponse } = require('@test/utils')
const { Types: { ObjectId } } = require("mongoose")

const COMMON_API = '/api/manage/movie/detail/douban/detail'

function responseExpect(res, validate=[]) {
  const { res: { data: target } } = res

  expect(target).to.be.a('object').that.includes.all.keys('name', 'classify', 'language', 'district', 'director', 'actor', 'alias', "screen_time", "description", "images", "poster", "video", "rate")
  commonValidate.string(target.name)
  expect(target.classify).to.be.a('array')
  target.classify.forEach(item => {
    commonValidate.objectId(item)
  })
  expect(target.language).to.be.a('array')
  target.language.forEach(item => {
    commonValidate.objectId(item)
  })
  expect(target.district).to.be.a('array')
  target.district.forEach(item => {
    commonValidate.objectId(item)
  })
  expect(target.director).to.be.a('array')
  target.director.forEach(item => {
    commonValidate.objectId(item)
  })
  expect(target.actor).to.be.a('array')
  target.actor.forEach(item => {
    commonValidate.objectId(item)
  })
  expect(target.alias).to.be.a('array')
  target.alias.forEach(item => {
    commonValidate.string(item)
  })
  commonValidate.string(target.screen_time)
  commonValidate.string(target.description)
  expect(target.images).to.be.a('array')
  target.images.forEach(item => {
    commonValidate.objectId(item)
  })
  commonValidate.objectId(target.poster)
  commonValidate.objectId(target.video)
  commonValidate.number(target.rate)

  if(Array.isArray(validate)) {
    validate.forEach(valid => {
      typeof valid == 'function' && valid(target)
    })
  }else if(typeof validate === 'function') {
    validate(target)
  }
}

describe(`${COMMON_API} test`, function() {

  let selfToken
  let userInfo
  let movieId = nanoid()

  before(function(done) {

    const { model: user, signToken } = mockCreateUser({
      username: COMMON_API
    }, {
      expiresIn: '120s'
    })

    user.save()
    .then((user) => {
      userInfo = user
      selfToken = signToken(userInfo._id)
    })
    .then(data => {
      const client = getClient()
      return new Promise((resolve, reject) => {
        client.setex(movieId, 10, JSON.stringify({
          name: COMMON_API,
          classify: [ObjectId('8f63270f005f1c1a0d9448ca')],
          language: [ObjectId('8f63270f005f1c1a0d9448ca')],
          district: [ObjectId('8f63270f005f1c1a0d9448ca')],
          director: [ObjectId('8f63270f005f1c1a0d9448ca')],
          actor: [ObjectId('8f63270f005f1c1a0d9448ca')],
          alias: [COMMON_API],
          screen_time: '2022-01-22',
          description: COMMON_API,
          images: [ObjectId('8f63270f005f1c1a0d9448ca')],
          poster: ObjectId('8f63270f005f1c1a0d9448ca'),
          video: ObjectId('8f63270f005f1c1a0d9448ca'),
          rate: 10
        }), (err) => {
          if(err) {
            reject(err)
          }else {
            resolve()
          }
        })
      })
    })
    .then(function() {
      done()
    })
    .catch(err => {
      done(err)
    })

  })

  after(function(done) {

    Promise.all([
      UserModel.deleteMany({
        username: COMMON_API
      }),
    ])
    .then(function() {
      done()
    })
    .catch(err => {
      done(err)
    })

  })

  describe(`${COMMON_API} success test`, function() {

    describe(`get movie success test -> ${COMMON_API}`, function() {
      it(`get the movie detail template success`, function(done) {

        Request
        .get(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .query({
          id: movieId
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if(err) return done(err)
          let obj = parseResponse(res)
          responseExpect(obj)
          done()
        })
  
      })

    })

  })

  describe(`${COMMON_API} fail test`, function() {
    
    describe(`get comment fail test -> ${COMMON_API}`, function() {

      it(`get the movie detail template fail because the movie id is not verify`, function(done) {

        Request
        .get(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(400)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if(err) return done(err)
          done()
        })
  
      })

      it(`get the movie detail template fail because overdue`, function(done) {

        new Promise(resolve => setTimeout(resolve, 1000 * 10))
        .then(_ => {
          Request
          .get(COMMON_API)
          .set({
            Accept: 'application/json',
            Authorization: `Basic ${selfToken}`
          })
          .query({
            id: movieId
          })
          .expect(500)
          .expect('Content-Type', /json/)
          .end(function(err, res) {
            if(err) return done(err)
            done()
          })
        })
  
      })

    })

  })

})