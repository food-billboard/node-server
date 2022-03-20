require('module-alias/register')
const {
  expect
} = require('chai')
const {
  Types: {
    ObjectId
  }
} = require('mongoose')
const {
  UserModel,
  ScreenModal,
  getClient,
  MEDIA_AUTH,
} = require('@src/utils')
const {
  Request,
  mockCreateUser,
  mockCreateScreen,
  deepParseResponse
} = require('@test/utils')

const COMMON_API = '/api/screen/share/valid'

describe(`${COMMON_API} test`, () => {

  let userInfo
  let screenId
  let selfToken
  let getToken

  before(function (done) {

    const {
      model,
      signToken
    } = mockCreateUser({
      username: COMMON_API
    })

    getToken = signToken

    model.save()
      .then((user) => {
        userInfo = user
        selfToken = getToken(userInfo._id)

        const {
          model
        } = mockCreateScreen({
          name: COMMON_API,
          enable: true,
          user: userInfo._id 
        })

        return model.save()

      })
      .then(data => {
        screenId = data._id
      })
      .then(_ => {
        done()
      })
      .catch(err => {
        done(err)
      })

  })

  after(function (done) {

    Promise.all([
        ScreenModal.deleteMany({
          name: COMMON_API
        }),
        UserModel.deleteMany({
          username: COMMON_API
        }),
      ])
      .then(_ => {
        done()
      })
      .catch(err => {
        done(err)
      })

  })
  
  describe(`get the screen valid info success test -> ${COMMON_API}`, function() {

    it(`get the screen valid info success`, function(done) {

      const redisClient = getClient()

      const json = {
        password: COMMON_API,
        auth: MEDIA_AUTH.PRIVATE,
        time: 3000,
        _id: screenId.toString()
      }

      const jsonString = JSON.stringify(json)

      new Promise((resolve, reject) => {
        redisClient.setex(screenId.toString(), 3, jsonString, (err) => {
          if (err) {
            reject(err)
          } else {
            resolve()
          }
        })
      })
      .then(_ => {
        return Request
        .get(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .query({
          _id: screenId.toString()
        })
        .expect(200)
        .expect('Content-Type', /json/)
      })
      .then(function(res) {
        let obj = deepParseResponse(res)
        expect(obj).to.be.a('object').and.includes.all.keys('auth', 'password')
        expect(obj.auth).to.be.equal(json.auth)
        expect(obj.password).to.be.true
      })
      .then(_ => {
        done()
      })
      .catch(err => {
        done(err)
      })

    })

  })

  describe(`get the screen valid info fail test -> ${COMMON_API}`, function() {

    it(`get the screen valid info fail because the id is not valid`, function(done) {
      Request
        .get(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .query({
          _id: screenId.toString().slice(1),
        })
        .expect(400)
        .expect('Content-Type', /json/)
        .then(_ => {
          done()
        })
        .catch(err => {
          done(err)
        })
    })

    it(`get the screen valid info fail because the id is not found`, function(done) {
      const id = screenId.toString()
      Request
        .get(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .query({
          _id: `${(id.slice(0, 1) + 4) % 10}${id.slice(1)}`
        })
        .expect(404)
        .expect('Content-Type', /json/)
        .then(_ => {
          done()
        })
        .catch(err => {
          done(err)
        })
    })

  })

  describe(`post the valid success test -> ${COMMON_API}`, function() {

    it(`post the valid success`, function(done) {

      const redis = getClient()

      const json = {
        password: COMMON_API,
        auth: MEDIA_AUTH.PRIVATE,
        time: 3000,
        _id: screenId.toString()
      }

      const jsonString = JSON.stringify(json)

      new Promise((resolve, reject) => {
        redis.setex(screenId.toString(), 3, jsonString, (err) => {
          if (err) {
            reject(err)
          } else {
            resolve()
          }
        })
      })
      .then(_ => {
        return Request
        .post(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .send({
          _id: screenId.toString(),
          password: COMMON_API
        })
        .expect(200)
        .expect('Content-Type', /json/)
      })
      .then(function(res) {
        let obj = deepParseResponse(res)
        expect(obj).to.be.true 
      })
      .then(_ => {
        return redis.del(screenId.toString())
      })
      .then(_ => {
        done()
      })
      .catch(err => {
        done(err)
      })

    })

  })

  describe(`post the valid fail test -> ${COMMON_API}`, function() {

    it(`post the valid fail because the id is not valid`, function(done) {
      Request
        .post(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .send({
          _id: screenId.toString().slice(1),
          password: COMMON_API
        })
        .expect(400)
        .expect('Content-Type', /json/)
        .then(_ => {
          done()
        })
        .catch(err => {
          done(err)
        })
    })

    it(`post the valid fail because the id is not found`, function(done) {
      const id = screenId.toString()
      Request
        .post(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .send({
          _id: `${(id.slice(0, 1) + 4) % 10}${id.slice(1)}`,
          password: COMMON_API
        })
        .expect(404)
        .expect('Content-Type', /json/)
        .then(_ => {
          done()
        })
        .catch(err => {
          done(err)
        })
    })

    it(`post the valid fail because the password not truth`, function(done) {
      const redis = getClient()

      const json = {
        password: COMMON_API,
        auth: MEDIA_AUTH.PRIVATE,
        time: 3000,
        _id: screenId.toString()
      }

      const jsonString = JSON.stringify(json)

      new Promise((resolve, reject) => {
        redis.setex(screenId.toString(), 3, jsonString, (err) => {
          if (err) {
            reject(err)
          } else {
            resolve()
          }
        })
      })
      .then(_ => {
        return Request
        .post(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .send({
          _id: screenId.toString(),
          password: '33333'
        })
        .expect(200)
        .expect('Content-Type', /json/)
      })
      .then(function(res) {
        let obj = deepParseResponse(res)
        expect(obj).to.be.false 
      })
      .then(_ => {
        return redis.del(screenId.toString())
      })
      .then(_ => {
        done()
      })
      .catch(err => {
        done(err)
      })
    })

  })

})