require('module-alias/register')
const { expect } = require('chai')
const { mockCreateUser, Request } = require('@test/utils')
const { UserModel, dealRedis } = require('@src/utils')
const { email_type } = require('@src/router/user/logon/map')

const COMMON_API = '/api/user/logon/forget'

describe(`reset the password test -> ${COMMON_API}`, function() {

  let result
  let password
  let email
  let redisKey
  const captcha = '123456'

  before(function(done) {

    const { model, decodePassword } = mockCreateUser({
      username: COMMON_API,
    })

    password = decodePassword

    model.save()
    .then(data => {
      result = data
      email = result.email
      redisKey = `${email}-${email_type[0]}`
      return dealRedis(function(redis) {
        return redis.set(redisKey, captcha, 'EX', 10)
      })
    })
    .then(data => {
      done()
    })
    .catch(err => {
      console.log('oops: ', err)
    })

  })

  after(function(done) {
    UserModel.deleteMany({
      username: COMMON_API
    })
    .then(function() {
      done()
    })
    .catch(err => {
      console.log('oops: ', err)
    })
  })

  describe(`reset the password successs test -> ${COMMON_API}`, function() {

    it(`reset the password success`, function(done) {

      Request
      .put(COMMON_API)
      .send({
        email: result.email,
        captcha,
        password
      })
      .set('Accept', 'Application/json')
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        done()
      })

    })

  })

  describe(`reset the password fail test -> ${COMMON_API}`, function() {

    it(`reset the password fail because the params of email is not verify`, function(done) {

      Request
      .put(COMMON_API)
      .send({
        email: COMMON_API,
        captcha,
        password
      })
      .set('Accept', 'Application/json')
      .expect(400)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        done()
      })

    })

    it(`reset the password fail because the params of captcha is not verify`, function(done) {

      Request
      .put(COMMON_API)
      .send({
        email: result.email,
        captcha: COMMON_API,
        password
      })
      .set('Accept', 'Application/json')
      .expect(400)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        done()
      })

    })

    it(`reset the password fail because the params of password is not verify`, function(done) {

      Request
      .put(COMMON_API)
      .send({
        email: result.email,
        captcha,
        password: ''
      })
      .set('Accept', 'Application/json')
      .expect(400)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        done()
      })

    })

    it(`reset the password fail because lack of the params of the email`, function(done) {

      Request
      .put(COMMON_API)
      .send({
        captcha,
        password
      })
      .set('Accept', 'Application/json')
      .expect(400)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        done()
      })

    })

    it(`reset the password fail because lack of the params of the password`, function(done) {

      Request
      .put(COMMON_API)
      .send({
        email: result.email,
        captcha,
      })
      .set('Accept', 'Application/json')
      .expect(400)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        done()
      })

    })

    it(`reset the password fail because lack of the params of the captcha`, function(done) {

      Request
      .put(COMMON_API)
      .send({
        email: result.email,
        password
      })
      .set('Accept', 'Application/json')
      .expect(400)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        done()
      })

    })

    it(`reset the password fail because the captcha is overday`, async function() {

      let res = true

      await dealRedis(function(redis) {
        return redis.del(redisKey)
      })
      .catch(err => {
        res = false
        console.log('oops: ', err)
      })

      await Request
      .put(COMMON_API)
      .send({
        email: result.email,
        captcha,
        password
      })
      .set('Accept', 'Application/json')
      .expect(400)
      .expect('Content-Type', /json/)

      return res ? Promise.resolve() : Promise.reject(COMMON_API)

    })
    
  })

})