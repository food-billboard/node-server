require('module-alias/register')
const { expect } = require('chai')
const { Types: { ObjectId } } = require('mongoose')
const { UserModel, ScreenModal } = require('@src/utils')
const { Request, mockCreateUser, mockCreateScreen } = require('@test/utils')

const COMMON_API = '/api/screen/preview'
const GET_VALID_API = '/api/screen/preview/valid'

describe(`${COMMON_API} test`, () => {

  let userInfo
  let screenId
  let selfToken
  let getToken

  before(function(done) {

    const { model, signToken } = mockCreateUser({
      username: COMMON_API
    })

    getToken = signToken

    model.save()
    .then((user) => {
      userInfo = user
      selfToken = getToken(userInfo._id)

      const { model } = mockCreateScreen({
        name: COMMON_API,
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

  after(function(done) {

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
  
  describe(`preview the screen success test -> ${COMMON_API}`, function() {

    it(`preview the screen success`, function(done) {

      Request
      .post(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        _id: screenId.toString() 
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .then(_ => {
        done()
      })
      .catch(err => {
        done(err)
      })

    })

  })

  describe(`preview the screen fail test -> ${COMMON_API}`, function() {

    it(`preview screen fail because the id is not valid`, function(done) {

      Request
      .post(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        _id: screenId.toString().slice(1)
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

    it(`preview screen fail because the id is not found`, function(done) {
      const id = screenId.toString()
      Request
      .post(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
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

    it(`preview screen fail because the creator is not self`, function(done) {

      ScreenModal.updateMany({
        name: COMMON_API
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
        .send({
          _id: screenId.toString(),
        })
        .expect(404)
        .expect('Content-Type', /json/)
      })
      .then(_ => {
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

  })

  describe(`get valid of the preview success test -> ${GET_VALID_API}`, function() {

    it(`get valid of the preview success`, function(done) {

      Request
      .get(GET_VALID_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
        _id: screenId.toString() 
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .then(_ => {
        done()
      })
      .catch(err => {
        done(err)
      })

    })

  })

  describe(`get valid of the preview fail test -> ${GET_VALID_API}`, function() {

    it(`get valid of the preview fail because the id is not valid`, function(done) {
      Request
      .get(GET_VALID_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
        _id: screenId.toString().slice(1)
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

    it(`get valid of the preview fail because the id is not found`, function(done) {
      const id = screenId.toString() 
      Request
      .get(GET_VALID_API)
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

    it(`get valid of the preview fail because the creator is not self`, function(done) {
      ScreenModal.updateMany({
        name: COMMON_API
      }, {
        user: ObjectId('8f63270f005f1c1a0d9448ca')
      })
      .then(_ => {
        return Request
        .get(GET_VALID_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .query({
          _id: screenId.toString(),
        })
        .expect(404)
        .expect('Content-Type', /json/)
      })
      .then(_ => {
        return ScreenModal.updateMany({
          name: COMMON_API,
        }, {
          user: ObjectId('8f63270f005f1c1a0d9448ca')
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