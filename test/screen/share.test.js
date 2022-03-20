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
  MEDIA_AUTH
} = require('@src/utils')
const {
  Request,
  mockCreateUser,
  mockCreateScreen,
  deepParseResponse
} = require('@test/utils')

const COMMON_API = '/api/screen/share'

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

  describe(`get the screen url is schedule success test -> ${COMMON_API}`, function () {

    it(`get the screen url is schedule success`, function (done) {

      const client = getClient()

      const jsonString = JSON.stringify({
        password: COMMON_API,
        auth: MEDIA_AUTH.PRIVATE,
        time: 3000,
        _id: screenId.toString()
      })

      new Promise((resolve, reject) => {
          client.setex(screenId.toString(), 3, jsonString, (err) => {
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
              _id: screenId.toString(),
            })
            .expect(200)
            .expect('Content-Type', /json/)
        })
        .then(data => {
          const result = deepParseResponse(data)
          expect(result).to.be.true
        })
        .then(_ => {
          return client.del(screenId.toString())
        })
        .then(_ => {
          done()
        })
        .catch(err => {
          done(err)
        })

    })

    it(`get the screen url is schedule success and is schedule`, function (done) {

      const client = getClient()

      const jsonString = JSON.stringify({
        password: COMMON_API,
        auth: MEDIA_AUTH.PRIVATE,
        time: 1000,
        _id: screenId.toString()
      })

      new Promise((resolve, reject) => {
          client.setex(screenId.toString(), 1, jsonString, (err) => {
            if (err) {
              reject(err)
            } else {
              resolve()
            }
          })
        })
        .then(_ => {
          return new Promise(resolve => setTimeout(resolve, 1010))
        })
        .then(_ => {
          return Request
            .get(COMMON_API)
            .set({
              Accept: 'application/json',
              Authorization: `Basic ${selfToken}`
            })
            .query({
              _id: screenId.toString(),
            })
            .expect(200)
            .expect('Content-Type', /json/)
        })
        .then(data => {
          const result = deepParseResponse(data)
          expect(result).to.be.false
        })
        .then(_ => {
          return client.del(screenId.toString())
        })
        .then(_ => {
          done()
        })
        .catch(err => {
          done(err)
        })

    })

  })

  describe(`get the screen url is schedule fail test -> ${COMMON_API}`, function () {

    it(`get the screen url is schedule fail because the id is not valid`, function (done) {
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

    it(`get the screen url is schedule fail because the id is not found`, function (done) {
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
        .expect(200)
        .expect('Content-Type', /json/)
        .then(data => {
          const result = deepParseResponse(data)
          expect(result).to.be.false 
        })
        .then(_ => {
          done()
        })
        .catch(err => {
          done(err)
        })
    })

  })

  describe(`post the screen share success test -> ${COMMON_API}`, function () {

    it(`post the screen share success`, function (done) {

      const data = {
        _id: screenId.toString(),
        auth: MEDIA_AUTH.PUBLIC,
        time: 3000,
        password: COMMON_API
      }

      Request
        .post(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .send(data)
        .expect(200)
        .expect('Content-Type', /json/)
        .then(function (res) {
          const redis = getClient()
          return redis.get(screenId.toString())
        })
        .then(res => {
          const result = JSON.parse(res)
          expect(data.auth).to.be.equal(result.auth)
          expect(data.time).to.be.equal(result.time)
          expect(data.password).to.be.equal(result.password)
        })
        .then(_ => {
          done()
        })
        .catch(err => {
          done(err)
        })

    })

  })

  describe(`cancel the screen share success test -> ${COMMON_API}`, function () {

    it(`cancel the screen share success`, function (done) {

      const data = {
        _id: screenId.toString(),
        auth: MEDIA_AUTH.PUBLIC,
        time: 3000,
        password: COMMON_API
      }

      Request
        .post(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .send(data)
        .expect(200)
        .expect('Content-Type', /json/)
        .then(function (res) {
          const redis = getClient()
          return redis.get(screenId.toString())
        })
        .then(res => {
          const result = JSON.parse(res)
          expect(data.auth).to.be.equal(result.auth)
          expect(data.time).to.be.equal(result.time)
          expect(data.password).to.be.equal(result.password)
        })
        .then(_ => {
          return Request
            .delete(COMMON_API)
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
        .then(function (res) {
          const redis = getClient()
          return redis.get(screenId.toString())
        })
        .then(data => {
          expect(!!data).to.be.false
        })
        .then(_ => {
          done()
        })
        .catch(err => {
          done(err)
        })

    })

  })

  describe(`post the screen share fail test -> ${COMMON_API}`, function () {

    it(`post the screen share fail because the id is not valid`, function (done) {
      const data = {
        _id: screenId.toString().slice(1),
        auth: MEDIA_AUTH.PUBLIC,
        time: 3000,
        password: COMMON_API
      }

      Request
        .post(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .send(data)
        .expect(400)
        .expect('Content-Type', /json/)
        .then(function (res) {
          const redis = getClient()
          return redis.get(screenId.toString())
        })
        .then(_ => {
          done()
        })
        .catch(err => {
          done(err)
        })
    })

    it(`post the screen share fail because the id is not found`, function (done) {
      const id = screenId.toString()
      const data = {
        _id: `${(id.slice(0, 1) + 4) % 10}${id.slice(1)}`,
        auth: MEDIA_AUTH.PUBLIC,
        time: 3000,
        password: COMMON_API
      }

      Request
        .post(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .send(data)
        .expect(404)
        .expect('Content-Type', /json/)
        .then(function (res) {
          const redis = getClient()
          return redis.get(`${(id.slice(0, 1) + 4) % 10}${id.slice(1)}`)
        })
        .then(res => {
          expect(!!res).to.be.false
        })
        .then(_ => {
          done()
        })
        .catch(err => {
          done(err)
        })
    })

    it(`post the screen share fail because the creator is not self`, function (done) {
      const data = {
        _id: screenId.toString(),
        auth: MEDIA_AUTH.PUBLIC,
        time: 3000,
        password: COMMON_API
      }

      ScreenModal.updateMany({
          name: COMMON_API,
        }, {
          user: ObjectId('8f63270f005f1c1a0d9448ca')
        })
        .then(_ => {
          return Request
            .post(COMMON_API)
            .set({
              Accept: 'application/json',
              Authorization: `Basic ${selfToken}`
            })
            .send(data)
            .expect(404)
            .expect('Content-Type', /json/)
        })
        .then(function (res) {
          return ScreenModal.updateMany({
            name: COMMON_API,
          }, {
            user: userInfo._id 
          })
        })
        .then(_ => {
          done()
        })
        .catch(err => {
          done(err)
        })
    })

    it(`post the screen share fail because the password is not valid`, function (done) {
      const data = {
        _id: screenId.toString(),
        auth: MEDIA_AUTH.PUBLIC,
        time: 3000,
        password: '2'
      }

      Request
        .post(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .send(data)
        .expect(400)
        .expect('Content-Type', /json/)
        .then(function (res) {
          const redis = getClient()
          return redis.get(screenId.toString())
        })
        .then(_ => {
          done()
        })
        .catch(err => {
          done(err)
        })
    })

    it(`post the screen share fail because the time is not valid`, function (done) {
      const data = {
        _id: screenId.toString().slice(1),
        auth: MEDIA_AUTH.PUBLIC,
        time: -1,
        password: COMMON_API
      }

      Request
        .post(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .send(data)
        .expect(400)
        .expect('Content-Type', /json/)
        .then(function (res) {
          const redis = getClient()
          return redis.get(screenId.toString())
        })
        .then(_ => {
          done()
        })
        .catch(err => {
          done(err)
        })
    })

    it(`post the screen share fail because the enable is false`, function (done) {
      const data = {
        _id: screenId.toString(),
        auth: MEDIA_AUTH.PUBLIC,
        time: 3000,
        password: COMMON_API
      }

      ScreenModal.updateMany({
          name: COMMON_API,
        }, {
          $set: {
            enable: false
          } 
        })
        .then(_ => {
          return Request
            .post(COMMON_API)
            .set({
              Accept: 'application/json',
              Authorization: `Basic ${selfToken}`
            })
            .send(data)
            .expect(404)
            .expect('Content-Type', /json/)
        })
        .then(function (res) {
          return ScreenModal.updateMany({
            name: COMMON_API,
          }, {
            $set: {
              enable: true 
            }
          })
        })
        .then(_ => {
          done()
        })
        .catch(err => {
          done(err)
        })
    })

  })

  describe(`cancel the screen share fail test -> ${COMMON_API}`, function () {

    it(`cancel the screen share fail because the id is not valid`, function (done) {

      Request
        .delete(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .query({
          _id: screenId.toString().slice(1)
        })
        .expect(400)
        .expect('Content-Type', /json/)
        .then(function (res) {
          const redis = getClient()
          return redis.get(screenId.toString())
        })
        .then(_ => {
          done()
        })
        .catch(err => {
          done(err)
        })
    })

    it(`cancel the screen share fail because the id is not found`, function (done) {
      const id = screenId.toString()

      Request
        .delete(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .query({
          _id: `${(id.slice(0, 1) + 4) % 10}${id.slice(1)}`,
        })
        .expect(404)
        .expect('Content-Type', /json/)
        .then(function (res) {
          const redis = getClient()
          return redis.get(`${(id.slice(0, 1) + 4) % 10}${id.slice(1)}`)
        })
        .then(res => {
          expect(!!res).to.be.false
        })
        .then(_ => {
          done()
        })
        .catch(err => {
          done(err)
        })
    })

    it(`cancel the screen share fail because the creator is not self`, function (done) {

      ScreenModal.updateMany({
          name: COMMON_API,
        }, {
          user: ObjectId('8f63270f005f1c1a0d9448ca')
        })
        .then(_ => {
          return Request
            .delete(COMMON_API)
            .set({
              Accept: 'application/json',
              Authorization: `Basic ${selfToken}`
            })
            .query({
              _id: screenId.toString()
            })
            .expect(404)
            .expect('Content-Type', /json/)
        })
        .then(function (res) {
          return ScreenModal.updateMany({
            name: COMMON_API,
          }, {
            user: userInfo._id 
          })
        })
        .then(_ => {
          done()
        })
        .catch(err => {
          done(err)
        })
    })

    it(`post the screen share fail because the enable is false`, function (done) {


      ScreenModal.updateMany({
          name: COMMON_API,
        }, {
          $set: {
            enable: false
          } 
        })
        .then(_ => {
          return Request
            .delete(COMMON_API)
            .set({
              Accept: 'application/json',
              Authorization: `Basic ${selfToken}`
            })
            .query({
              _id: screenId.toString()
            })
            .expect(404)
            .expect('Content-Type', /json/)
        })
        .then(function (res) {
          return ScreenModal.updateMany({
            name: COMMON_API,
          }, {
            $set: {
              enable: true 
            }
          })
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
