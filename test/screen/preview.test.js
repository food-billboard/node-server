require('module-alias/register')
const { expect } = require('chai')
const { UserModel, VideoModel, ImageModel } = require('@src/utils')
const { Request, commonValidate, mockCreateUser, mockCreateImage, mockCreateVideo, parseResponse, deepParseResponse, mockCreateScreen } = require('@test/utils')

const COMMON_API = '/api/screen/preview'
const GET_VALID_API = '/api/screen/preview/valid'

describe(`${COMMON_API} test`, () => {

  let userInfo
  let selfToken
  let videoData
  let imageId 
  let getToken

  before(function(done) {

    const { model } = mockCreateImage({
      name: COMMON_API,
      src: COMMON_API
    })

    model.save()
    .then(data => {
      imageId = data._id 
      const { model } = mockCreateVideo({
        name: COMMON_API,
        poster: imageId,
        src: `/static/image/${COMMON_API}`
      })
      return model.save()
    })
    .then((video) => {
      videoData = video

      const { model: user, signToken } = mockCreateUser({
        username: COMMON_API
      })

      getToken = signToken

      return user.save()
    })
    .then((user) => {
      userInfo = user
      selfToken = getToken(userInfo._id)
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
      VideoModel.deleteMany({
        name: COMMON_API
      }),
      UserModel.deleteMany({
        username: COMMON_API
      }),
      ImageModel.deleteMany({
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
  
  describe(`preview the screen success test -> ${COMMON_API}`, function() {

    it(`preview the screen success`, function(done) {

      Request
      .get(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
        src: videoData.src,
        type: "video"
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .then(function(res) {
        let obj = parseResponse(res)
        responseExpect(obj, (target) => {
          expect(target.length).to.be.not.equals(0)
          expect(target.some(item => item._id === videoData._id.toString())).to.be.true 
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

  describe(`preview the screen fail test -> ${COMMON_API}`, function() {

    it(`preview screen fail because the id is not valid`, function(done) {

    })

    it(`preview screen fail because the id is not found`, function(done) {

    })

    it(`preview screen fail because the creator is not self`, function(done) {

    })

  })

  describe(`get valid of the preview success test -> ${GET_VALID_API}`, function() {

    it(`get valid of the preview success`, function(done) {

      Request
      .get(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
        src: videoData.src,
        type: "video"
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .then(function(res) {
        let obj = parseResponse(res)
        responseExpect(obj, (target) => {
          expect(target.length).to.be.not.equals(0)
          expect(target.some(item => item._id === videoData._id.toString())).to.be.true 
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

  describe(`get valid of the preview fail test -> ${GET_VALID_API}`, function() {

    it(`get valid of the preview fail because the id is not valid`, function(done) {

    })

    it(`get valid of the preview fail because the id is not found`, function(done) {

    })

    it(`get valid of the preview fail because the creator is not self`, function(done) {

    })

  })

})