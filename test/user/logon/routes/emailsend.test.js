require('module-alias/register')
const { mockCreateUser, Request } = require('@test/utils')
const { UserModel, dealRedis } = require('@src/utils')
const { email_type } = require('@src/router/user/logon/map')

const COMMON_API = '/api/user/logon/email'

describe(`send mail test -> ${COMMON_API}`, function() {

  let result
  const type = email_type[0]
  let email
  let redisKey

  before(function(done) {

    const { model, decodePassword } = mockCreateUser({
      username: COMMON_API
    })

    password = decodePassword

    model.save()
    .then(data => {
      result = data
      email = result.email
      redisKey = `${email}-${type}`
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

  beforeEach(async function() {

    let res = true

    //每次请求前把redis删除
    await dealRedis(function(redis) {
      return redis.del(redisKey)
    })
    .catch(err => {
      console.log('oops: ', err)
      res = false
    })

    return res ? Promise.resolve() : Promise.reject(COMMON_API)

  })

  describe(`send mail success test -> ${COMMON_API}`, function() {

    // it(`send mail success`, function(done) {

    //   Request
    //   .post(COMMON_API)
    //   .send({
    //     email: result.email,
    //     type
    //   })
    //   .set('Accept', 'Application/json')
    //   .expect(200)
    //   .expect('Content-Type', /json/)
    //   .end(function(err, res) {
    //     if(err) return done(err)
    //     done()
    //   })

    // })

  })

  describe(`send mail fail test -> ${COMMON_API}`, function() {

    it(`send mail fail because the params of email is not verify`, function(done) {

      Request
      .post(COMMON_API)
      .send({
        email: COMMON_API,
        type
      })
      .set('Accept', 'Application/json')
      .expect(400)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        done()
      })

    })

    it(`send mail fail because the params of type is not verify`, function(done) {

      Request
      .post(COMMON_API)
      .send({
        email: result.email,
        type: ''
      })
      .set('Accept', 'Application/json')
      .expect(400)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        done()
      })

    })

    it(`send mail fail because lack of the params of email`, function(done) {

      Request
      .post(COMMON_API)
      .send({
        type
      })
      .set('Accept', 'Application/json')
      .expect(400)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        done()
      })

    })

    it(`send mail fail because lack of the params of type`, function(done) {

      Request
      .post(COMMON_API)
      .send({
        email: result.email,
      })
      .set('Accept', 'Application/json')
      .expect(400)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        done()
      })

    })

    it(`send mail fail because the redis is exists`, async function() {

      let res = true

      await dealRedis(function(redis) {
        console.log(redisKey)
        return redis.set(redisKey, type, 'EX', 10)
      })
      .catch(err => {
        console.log('oops: ', err)
        res = false
      })

      await Request
      .post(COMMON_API)
      .send({
        email: result.email,
        type
      })
      .set('Accept', 'Application/json')
      .expect(429)
      .expect('Content-Type', /json/)

      return res ? Promise.resolve() : Promise.reject(COMMON_API)

    })
    
  })

})

