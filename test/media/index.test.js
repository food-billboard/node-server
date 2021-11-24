require('module-alias/register')
const { expect } = require('chai')
const { UserModel, VideoModel, ImageModel } = require('@src/utils')
const { Request, commonValidate, mockCreateUser, mockCreateImage, mockCreateVideo, parseResponse, deepParseResponse } = require('@test/utils')

const COMMON_API = '/api/media'

function responseExpect(res, validate=[]) {
  const { res: { data: target } } = res

  expect(target).to.be.a("array")

  target.forEach(item => {
    expect(item).to.be.a("object").and.that.include.any.keys("_id", "src", "poster")
    commonValidate.objectId(item._id)
    commonValidate.string(item.src)
    if(item.poster) commonValidate.string(item.poster)
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
  
  describe(`get the media info success test -> ${COMMON_API}`, function() {

    it(`get the media info success with src`, function(done) {

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

    it(`get the media info success with _id`, function(done) {

      Request
      .get(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
        _id: videoData._id.toString(),
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

  describe(`get the media info fail test -> ${COMMON_API}`, function() {

    it(`get the media info fail because lack of the type params`, function(done) {

      Request
      .get(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
        _id: videoData._id.toString(),
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

    it(`get the media info fail because the type params is not valid`, function(done) {

      Request
      .get(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
        _id: videoData._id.toString(),
        type: ""
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

    it(`get the media info fail because the src params and _id params is not valid`, function(done) {

      Request
      .get(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
        type: "video"
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