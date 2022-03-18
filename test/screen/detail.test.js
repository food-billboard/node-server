require('module-alias/register')
const { expect } = require('chai')
const { UserModel, VideoModel, ImageModel } = require('@src/utils')
const { Request, commonValidate, mockCreateUser, mockCreateImage, mockCreateVideo, parseResponse, deepParseResponse, mockCreateScreen } = require('@test/utils')

const COMMON_API = '/api/screen/detail'

function responseExpect(res, validate=[]) {
  const { res: { data: target } } = res

  expect(target).to.be.a("object").and.that.includes.any.keys('_id', 'name', 'description', 'poster', 'components')
  commonValidate.objectId(target._id)
  commonValidate.string(target.name)
  commonValidate.string(target.description)
  commonValidate.poster(target.poster)
  expect(target.components).to.be.a('object')

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
  
  describe(`get the screen detail success test -> ${COMMON_API}`, function() {

    it(`get the screen detail success`, function(done) {

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


    it(`get screen detail success and the creator is not self but is share get`, function(done) {

    })

  })

  describe(`get the screen detail fail test -> ${COMMON_API}`, function() {

    it(`get screen detail fail because the id is not valid`, function(done) {

    })

    it(`get screen detail fail because the id is not found`, function(done) {

    })

    it(`get screen detail fail because the creator is not self and not share get`, function(done) {

    })

    it(`get screen detail fail because the user-agent is not equal the cookie`, function() {
      
    })

  })

})