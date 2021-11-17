require('module-alias/register')
const { expect } = require('chai')
const path = require("path")
const { Types: { ObjectId } } = require("mongoose")
const fs = require("fs-extra")
const { UserModel, VideoModel, ImageModel, MEDIA_ORIGIN_TYPE, MEDIA_AUTH, STATIC_FILE_PATH } = require('@src/utils')
const { Request, commonValidate, mockCreateUser, mockCreateRealVideo, parseResponse, deepParseResponse } = require('@test/utils')

const COMMON_API = '/api/media/video/poster'

function responseExpect(res, validate=[]) {
  const { res: { data: target } } = res

  commonValidate.objectId(target)

  if(Array.isArray(validate)) {
    validate.forEach(valid => {
      typeof valid == 'function' && valid(target)
    })
  }else if(typeof validate === 'function') {
    validate(target)
  }
}

function existsAndDeleteImage(id, filter) {
  let imageData 
  return ImageModel.findOne({
    _id: ObjectId(id),
  })
  .select({
    _id: 1,
    src: 1,
    name: 1,
    origin_type: 1,
    auth: 1,
    info: 1
  })
  .exec()
  .then(data => {
    if(!data) return Promise.reject(false) 
    const { src } = data
    const [ target ] = src.match(/(?<=.+)\/image\/.+/) 
    imageData = data 
    const absolutePath = path.join(STATIC_FILE_PATH, target)
    return Promise.all([
      ImageModel.deleteOne({
        _id: data._id 
      }),
      fs.readFile(absolutePath)
      .then(result => {
        return result.byteLength === data.info.size ? true : Promise.reject()
      })
      .then(_ => {
        return fs.unlink(absolutePath)
      })
    ])
  })
  .then(data => {
    return filter ? filter(imageData) : true 
  })
  .catch(err => {
    return false 
  })
}

describe(`${COMMON_API} test`, () => {

  let userInfo
  let selfToken
  let videoId 
  let getToken
  let videoDelete  

  before(function(done) {

    mockCreateRealVideo({})
    .then(({ model, unlink }) => {
      videoDelete = unlink 
      return model.save()
    })
    .then((video) => {
      videoId = video._id

      const { model: user, signToken } = mockCreateUser({
        username: COMMON_API
      }, {
        expiresIn: "20s"
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
        _id: videoId
      }),
      UserModel.deleteMany({
        username: COMMON_API
      }),
      videoDelete()
    ])
    .then(_ => {
      done()
    })
    .catch(err => {
      done(err)
    })

  })
  
  describe(`generate the video poster success test -> ${COMMON_API}`, function() {

    it(`generate the video poster success with name`, function(done) {

      const filename = COMMON_API.split("/").join("-")

      Request
      .put(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        name: filename,
        _id: videoId.toString()
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .then(function(res) {
        let obj = parseResponse(res)
        const id = deepParseResponse(res)
        responseExpect(obj, (target) => {
          expect(target.length).to.be.not.equals(0)
        })
        return existsAndDeleteImage(id, (data) => {
          return data.name.includes(filename) ? true : Promise.reject()
        })
      })
      .then(data => {
        if(data) {
          return done()
        }else {
          return done("request error")
        }
      })
      .catch(err => {
        done(err)
      })

    })

    it(`generate the video poster success with time`, function(done) {

      let fileSize 
      let mockData 

      Request
      .put(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        _id: videoId.toString()
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .then(data => {
        mockData = data 
      })
      .then(_ => {
        return Request
        .put(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .send({
          time: "00:00:01",
          _id: videoId.toString()
        })
        .expect(200)
        .expect('Content-Type', /json/)
      })
      .then(function(res) {
        let obj = parseResponse(res)
        const id = deepParseResponse(res)
        responseExpect(obj, (target) => {
          expect(target.length).to.be.not.equals(0)
        })
        return existsAndDeleteImage(id, (data) => {
          return data.info.size !== fileSize
        })
      })
      .then(data => {
        const id = deepParseResponse(mockData)
        return existsAndDeleteImage(id)
        .then(_ => data)
      })
      .then(data => {
        if(data) {
          return done()
        }else {
          return done("request error")
        }
      })
      .catch(err => {
        done(err)
      })

    })

    it(`generate the video poster success with origin_type`, function(done) {

      Request
      .put(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        origin_type: MEDIA_ORIGIN_TYPE.ORIGIN,
        _id: videoId.toString()
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .then(function(res) {
        let obj = parseResponse(res)
        const id = deepParseResponse(res)
        responseExpect(obj, (target) => {
          expect(target.length).to.be.not.equals(0)
        })
        return existsAndDeleteImage(id, (data) => {
          return data.origin_type.toUpperCase() === MEDIA_ORIGIN_TYPE.ORIGIN
        })
      })
      .then(data => {
        if(data) {
          return done()
        }else {
          return done("request error")
        }
      })
      .catch(err => {
        done(err)
      })

    })

    it(`generate the video poster success with auth`, function(done) {

      Request
      .put(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        auth: MEDIA_AUTH.PRIVATE,
        _id: videoId.toString()
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .then(function(res) {
        let obj = parseResponse(res)
        const id = deepParseResponse(res)
        responseExpect(obj, (target) => {
          expect(target.length).to.be.not.equals(0)
        })
        return existsAndDeleteImage(id, (data) => {
          return data.auth.toUpperCase() == MEDIA_AUTH.PRIVATE
        })
      })
      .then(data => {
        if(data) {
          return done()
        }else {
          return done("request error")
        }
      })
      .catch(err => {
        done(err)
      })

    })

  })

  describe(`generate the video poster fail test -> ${COMMON_API}`, function() {

    it(`generate the video poster fail because lack of the _id params`, function(done) {

      Request
      .put(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .expect(400)
      .expect('Content-Type', /json/)
      .then(data => {
        done()
      })
      .catch(err => {
        done(err)
      })

    })

    it(`generate the video poster fail because the _id params is not valid`, function(done) {

      Request
      .put(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        _id: videoId.toString().slice(1)
      })
      .expect(400)
      .expect('Content-Type', /json/)
      .then(data => {
        done()
      })
      .catch(err => {
        done(err)
      })

    })

    it(`generate the video poster fail because the time params is not valid`, function(done) {

      Request
      .put(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        _id: videoId.toString(),
        time: "00:00:-1"
      })
      .expect(500)
      .expect('Content-Type', /json/)
      .then(data => {
        done()
      })
      .catch(err => {
        done(err)
      })

    })

  })
})