require('module-alias/register')
const { expect } = require('chai')
const { Types: { ObjectId } } = require('mongoose')
const { UserModel, ScreenModal, ScreenModelModal } = require('@src/utils')
const { Request, mockCreateUser, mockCreateScreen, deepParseResponse, mockCreateScreenModel } = require('@test/utils')

const COMMON_API = '/api/screen/copy'

describe(`${COMMON_API} test`, () => {

  let userInfo
  let screenId
  let modelId 
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
      const { model: screenModel } = mockCreateScreenModel({
        name: COMMON_API,
        user: userInfo._id 
      })

      return Promise.all([
        model.save(),
        screenModel.save() 
      ])

    })
    .then(([data, model]) => {
      screenId = data._id 
      modelId = model._id 
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
      ScreenModelModal.deleteMany({
        name: COMMON_API
      })
    ])
    .then(_ => {
      done()
    })
    .catch(err => {
      done(err)
    })

  })
  
  describe(`copy the screen model success test -> ${COMMON_API}`, function() {

    it(`copy the screen model success`, function(done) {

      Request
      .post(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        _id: screenId.toString(),
        type: 'screen'
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .then(data => {
        const value = deepParseResponse(data)

        return ScreenModal.findOne({
          _id: ObjectId(value[0])
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

    it(`copy the model success`, function(done) {
      Request
      .post(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        _id: modelId.toString(),
        type: 'model'
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .then(data => {
        const value = deepParseResponse(data)

        return ScreenModal.findOne({
          _id: ObjectId(value[0])
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

  describe(`copy the screen model fail test -> ${COMMON_API}`, function() {

    it(`copy screen model fail because the id is not valid`, function(done) {
      Request
      .post(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        _id: screenId.toString().slice(1),
        type: 'screen'
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

    it(`copy screen model fail because the id is not found`, function(done) {

      const id = screenId.toString()

      Request
      .post(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        _id: '8f63270f005f1c1a0d9448ca',
        type: 'screen'
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

    it(`copy screen model fail because the type is not valid`, function(done) {
      Request
      .post(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        _id: screenId.toString(),
        type: ''
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

  })

})