require('module-alias/register')
const { mockCreateUser, Request } = require('@test/utils')
const { UserModel, redis } = require('@src/utils')

const COMMON_API = '/api/user/logon/email'

describe(`send mail test -> ${COMMON_API}`, function() {

  let result
  const type = email_type[0]
  const redisKey = `${result.email}-${type}`

  before(function(done) {

    const { model } = mockCreateUser({
      username: COMMON_API
    })

    password = decodePassword

    return model.save()
    .then(data => {
      result = data
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

  beforeEach(function(done) {
    //每次请求前把redis删除
  })

  describe(`send mail success test -> ${COMMON_API}`, function() {

    it(`send mail success`, function(done) {

      Request
      .post(COMMON_API)
      .send({
        email: result.email,
        type
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
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        done()
      })

    })

    it(`send mail fail because the redis is exists`, function() {

      await redis.set(redisKey, type, 10)

      await Request
      .post(COMMON_API)
      .send({
        email: result.email,
        type
      })
      .set('Accept', 'Application/json')
      .expect(429)
      .expect('Content-Type', /json/)

      return Promise.resolve()

    })
    
  })

})

