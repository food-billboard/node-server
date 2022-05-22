require('module-alias/register')
const { expect } = require('chai')
const fs = require('fs-extra')
const path = require('path')
const { UserModel, OtherMediaModel, STATIC_FILE_PATH } = require('@src/utils')
const { Request, mockCreateUser, deepParseResponse, mockCreateOtherMedia } = require('@test/utils')

const COMMON_API = '/api/screen/pre/leadin'
const FILE_NAME = 'api-screen-pre-leadin'

describe(`${COMMON_API} test`, () => {

  let userInfo
  let screenId
  let selfToken
  let getToken
  let otherId
  const databaseFilePath = path.join('/static/other', FILE_NAME + '.json')
  let filePath = path.join(STATIC_FILE_PATH, 'other', FILE_NAME + '.json')

  before(function(done) {

    const { model, signToken } = mockCreateUser({
      username: COMMON_API
    })
    const { model: other } = mockCreateOtherMedia({
      src: databaseFilePath
    })

    getToken = signToken

    Promise.all([
      model.save(),
      other.save()
    ])
    .then(([user, other]) => {
      userInfo = user
      otherId = other._id 
      selfToken = getToken(userInfo._id)

      return fs.writeFile(filePath, '')

    })
    .then(data => {
      return fs.writeJSON(filePath, {
        data: "{}",
        version: "1.1",
        flag: 'PC',
        name: COMMON_API,
        poster: COMMON_API,
        description: COMMON_API
      })
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
      OtherMediaModel.deleteMany({
        src: filePath
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
  
  describe(`lead in screen data success test -> ${COMMON_API}`, function() {

    it(`lead in the screen model success`, function(done) {

      Request
      .post(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        _id: otherId.toString(),
        type: 'screen'
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .then(data => {
        const value = deepParseResponse(data)

        expect(!!value).to.be.true
      })
      .then(_ => {
        done()
      })
      .catch(err => {
        done(err)
      })

    })

  })

  describe(`lead in the screen model fail test -> ${COMMON_API}`, function() {

    it(`lead in screen model fail because the id is not valid`, function(done) {
      Request
      .post(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        _id: otherId.toString().slice(1),
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

    it(`lead in screen model fail because the id is not found`, function(done) {

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

    it(`lead in screen model fail because the type is not valid`, function(done) {
      Request
      .post(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        _id: otherId.toString(),
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