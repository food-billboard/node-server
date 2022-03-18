require('module-alias/register')
const { expect } = require('chai')
const { UserModel, VideoModel, ImageModel } = require('@src/utils')
const { Request, commonValidate, mockCreateUser, mockCreateImage, mockCreateVideo, parseResponse, deepParseResponse, mockCreateScreen } = require('@test/utils')

const COMMON_API = '/api/screen'

function responseExpect(res, validate=[]) {
  const { res: { data: target } } = res

  expect(target).to.be.a("array")

  target.forEach(item => {
    expect(item).to.be.a("object").and.that.include.any.keys("_id", "name", "user", "enable", "flag", "description", "poster", "createdAt", "updatedAt")
    commonValidate.objectId(item._id)
    commonValidate.string(item.name)
    commonValidate.string(item.description)
    commonValidate.string(item.flag)
    commonValidate.poster(item.poster)
    expect(item.enable).to.be.a('boolean')
    commonValidate.date(item.createdAt)
    commonValidate.date(item.updatedAt)
    expect(item.user).to.be.a('object').and.that.includes.any.keys('username', 'avatar', '_id')
    commonValidate.string(item.user.username)
    commonValidate.poster(item.user.poster)
    commonValidate.objectId(item.user._id)
  })

  if(Array.isArray(validate)) {
    validate.forEach(valid => {
      typeof valid == 'function' && valid(target)
    })
  }else if(typeof validate === 'function') {
    validate(target)
  }
}

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
  
  describe(`get the screen list success test -> ${COMMON_API}`, function() {

    it(`get the screen list success with content`, function(done) {

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

  describe('delete screen success', function(done) {

    it(`delete screen success`, function(done) {

    })

  })

  describe('post screen success test', function() {

    it('post screen success', function(done) {

    })

  })

  describe('put screen success test', function() {

    it('put screen success', function(done) {

    })

  })

  describe(`delete the screen fail test -> ${COMMON_API}`, function() {

    it(`delete screen fail because the id is not valid`, function(done) {

    })

    it(`delete screen fail because the id is not found`, function(done) {

    })

  })

  describe(`post screen fail test`, function() {

    it(`post screen fail because the name's length is too short`, () => {

    })

    it(`post screen fail because the name's length is too long`, () => {

    })

    it(`post screen fail because the data is not json`, () => {

    })

    it(`post screen fail because the flag is not valid`, () => {

    })

    it(`post screen fail because the poster is not valid`, () => {

    })

  })

  describe(`put screen fail test`, function() {

    it(`put screen fail because the id is not valid`, () => {

    })

    it(`put screen fail because the screen creator is not self`, () => {

    })

  })

})