require('module-alias/register')
const { expect } = require('chai')
const { UserModel, ScreenModelModal } = require('@src/utils')
const { Request, mockCreateUser, mockCreateScreenModel } = require('@test/utils')

const COMMON_API = '/api/screen/model/enable'

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

      const { model } = mockCreateScreenModel({
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
      ScreenModelModal.deleteMany({
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
  
  describe(`enable the screen success test -> ${COMMON_API}`, function() {

    it(`enable the screen success`, function(done) {

      ScreenModelModal.updateMany({
        name: COMMON_API
      }, {
        $set: {
          enable: false 
        }
      })
      .then(_ => {
        return Request
        .put(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .send({
          _id: screenId.toString() 
        })
        .expect(200)
        .expect('Content-Type', /json/)
      })
      .then(_ => {
        return ScreenModelModal.findOne({
          name: COMMON_API,
          enable: true 
        })
        .select({
          _id: 1 
        })
        .exec() 
      })
      .then(data => {
        expect(!!data).to.be.true
      })
      .then(_ => {
        done()
      })
      .catch(err => {
        done(err)
      })

    })

  })

  describe(`enable the screen fail test -> ${COMMON_API}`, function() {

    it(`enable screen fail because the id is not valid`, function(done) {
      Request
      .put(COMMON_API)
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

    it(`enable screen fail because the id is not found`, function(done) {

      const id = screenId.toString()

      Request
      .put(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        _id: `${(id.slice(0, 1) + 4) % 10}${id.slice(1)}`
      })
      .expect(403)
      .expect('Content-Type', /json/)
      .then(_ => {
        done()
      })
      .catch(err => {
        done(err)
      })
    })

  })

  describe(`disable the screen success test -> ${COMMON_API}`, function() {

    it(`disable the screen success`, function(done) {

      ScreenModelModal.updateOne({
        name: COMMON_API
      }, {
        $set: {
          enable: true  
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
        .expect(200)
        .expect('Content-Type', /json/)
      })
      .then(_ => {
        return ScreenModelModal.findOne({
          name: COMMON_API,
          enable: false 
        })
        .select({
          _id: 1 
        })
        .exec() 
      })
      .then(data => {
        expect(!!data).to.be.true
      })
      .then(_ => {
        done()
      })
      .catch(err => {
        done(err)
      })

    })

  })

  describe(`disable the screen fail test -> ${COMMON_API}`, function() {

    it(`disable screen fail because the id is not valid`, function(done) {
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
      .then(_ => {
        done()
      })
      .catch(err => {
        done(err)
      })
    })

    it(`disable screen fail because the id is not found`, function(done) {
      const id = screenId.toString()

      Request
      .delete(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
        _id: `${(id.slice(0, 1) + 4) % 10}${id.slice(1)}`
      })
      .expect(403)
      .expect('Content-Type', /json/)
      .then(_ => {
        done()
      })
      .catch(err => {
        done(err)
      })
    })

  })

})