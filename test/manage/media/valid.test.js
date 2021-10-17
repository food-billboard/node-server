require('module-alias/register')
const fs = require('fs')
const path = require('path')
const { UserModel, ImageModel, MEDIA_AUTH, MEDIA_STATUS, STATIC_FILE_PATH } = require('@src/utils')
const { expect } = require('chai')
const { Request, mockCreateUser, mockCreateImage } = require('@test/utils')

const COMMON_API = '/api/manage/media/valid'

function responseExpect(res, validate=[]) {
  const { res: { data: target } } = res

  expect(target).to.be.a("array")

  target.forEach(item => {
    expect(item).to.be.a('object').and.that.include.all.keys('complete', 'error', 'exists')
    expect(item.complete).to.be.a('boolean')
    expect(item.error).to.be.a('boolean')
    expect(item.exists).to.be.a('boolean')
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
  let anotherUserId
  let selfToken
  let imageId
  let getToken
  const imageSize = 1024
  const filePath = path.join('/static', 'image', 'test-unUnuse.png')
  const realFilePath = path.join(STATIC_FILE_PATH, 'image', 'test-unUnuse.png')

  before(function(done) {


    fs.promises.writeFile(realFilePath, '233333').then(_ => {
      const { model } = mockCreateImage({
        src: filePath,
        name: COMMON_API,
        auth: MEDIA_AUTH.PUBLIC,
        info: {
          size: imageSize
        }
      })
      return model.save()
    })
    .then((image) => {
      imageId = image._id

      const { model: user, signToken } = mockCreateUser({
        username: COMMON_API,
        avatar: imageId
      })

      const { model: other } = mockCreateUser({
        username: COMMON_API,
      })

      getToken = signToken

      return Promise.all([
        user.save(),
        other.save()
      ])

    })
    .then(([user, other]) => {
      userInfo = user
      anotherUserId = other._id
      selfToken = getToken(userInfo._id)
      return ImageModel.updateOne({
        name: COMMON_API
      }, {
        $set: { origin: userInfo._id }
      })
    })
    .then(_ => {
      done()
    })
    .catch(err => {
      console.log('oops: ', err)
    })

  })

  after(function(done) {

    Promise.all([
      ImageModel.deleteMany({
        $or: [
          {
            src: COMMON_API
          },
          {
            name: COMMON_API
          }
        ]
      }),
      UserModel.deleteMany({
        username: COMMON_API
      }),
      fs.promises.unlink(realFilePath)
    ])
    .then(_ => {
      done()
    })
    .catch(err => {
      console.log('oops: ', err)
      done(err)
    })

  })
  
  describe(`get the media valid success test -> ${COMMON_API}`, function() {

    it(`get the media valid success and database not found`, function(done) {

      const id = imageId.toString()

      Request
      .get(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
        type: 0,
        _id: `${Math.floor(10 / (+id.slice(0, 1) + 1))}${id.slice(1)}`,
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        const { res: { text } } = res
        let obj
        try{
          obj = JSON.parse(text)
        }catch(_) {
          console.log(_)
        }
        responseExpect(obj, (target) => {
          target.forEach(item => {
            expect(item.complete).to.be.false
            expect(item.error).to.be.true
            expect(item.exists).to.be.false
          })
        })
        done()
      })

    })

    it(`get the media valid success and database error`, function(done) {

      ImageModel.updateOne({
        _id: imageId.toString()
      }, {
        $set: { "info.status": MEDIA_STATUS.ERROR }
      })
      .then(_ => {
        return Request
        .get(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .query({
          type: 0,
          _id: imageId.toString()
        })
        .expect(200)
        .expect('Content-Type', /json/)
      })
      .then(function(res) {
        const { res: { text } } = res
        let obj
        try{
          obj = JSON.parse(text)
        }catch(_) {
          console.log(_)
        }
        responseExpect(obj, (target) => {
          target.forEach(item => {
            expect(item.complete).to.be.false
            expect(item.error).to.be.true
            expect(item.exists).to.be.true
          })
        })
      })
      .then(_ => {
        return ImageModel.updateOne({
          _id: imageId.toString()
        }, {
          $set: { "info.status": MEDIA_STATUS.COMPLETE }
        })
      })
      .then(_ => {
        done()
      })
      .catch(err => {
        console.log('oops: ', err)
        done(err)
      })

    })

    it(`get the media valid success and database uploading`, function(done) {

      ImageModel.updateOne({
        _id: imageId.toString()
      }, {
        $set: { "info.status": MEDIA_STATUS.UPLOADING }
      })
      .then(_ => {
        return Request
        .get(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .query({
          type: 0,
          _id: imageId.toString()
        })
        .expect(200)
        .expect('Content-Type', /json/)
      })
      .then(function(res) {
        const { res: { text } } = res
        let obj
        try{
          obj = JSON.parse(text)
        }catch(_) {
          console.log(_)
        }
        responseExpect(obj, (target) => {
          target.forEach(item => {
            expect(item.complete).to.be.false
            expect(item.error).to.be.false
            expect(item.exists).to.be.true
          })
        })
      })
      .then(_ => {
        return ImageModel.updateOne({
          _id: imageId.toString()
        }, {
          $set: { "info.status": MEDIA_STATUS.COMPLETE }
        })
      })
      .then(_ => {
        done()
      })
      .catch(err => {
        console.log('oops: ', err)
        done(err)
      })

    })

    it(`get the media valid success and database complete`, function(done) {

      ImageModel.updateOne({
        _id: imageId.toString()
      }, {
        $set: { "info.status": MEDIA_STATUS.COMPLETE }
      })
      .then(_ => {
        return Request
        .get(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .query({
          type: 0,
          _id: imageId.toString()
        })
        .expect(200)
        .expect('Content-Type', /json/)
      })
      .then(function(res) {
        const { res: { text } } = res
        let obj
        try{
          obj = JSON.parse(text)
        }catch(_) {
          console.log(_)
        }
        responseExpect(obj, (target) => {
          target.forEach(item => {
            expect(item.complete).to.be.true
            expect(item.error).to.be.false
            expect(item.exists).to.be.true
          })
        })
      })
      .then(_ => {
        return ImageModel.updateOne({
          _id: imageId.toString()
        }, {
          $set: { "info.status": MEDIA_STATUS.COMPLETE }
        })
      })
      .then(_ => {
        done()
      })
      .catch(err => {
        console.log('oops: ', err)
        done(err)
      })

    })

    it(`get the media valid success and file exists`, function(done) {

      Request
      .get(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
        type: 0,
        _id: imageId.toString()
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        const { res: { text } } = res
        let obj
        try{
          obj = JSON.parse(text)
        }catch(_) {
          console.log(_)
        }
        responseExpect(obj, (target) => {
          target.forEach(item => {
            expect(item.complete).to.be.true
            expect(item.error).to.be.false
            expect(item.exists).to.be.true
          })
        })
        done()
      })

    })

    it(`get the media valid success and file not exists`, function(done) {

      ImageModel.updateOne({
        _id: imageId.toString()
      }, {
        $set: { src: path.join(STATIC_FILE_PATH, 'image', COMMON_API + 'unlook.jpg') }
      })
      .then(_ => {
        return Request
        .get(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .query({
          type: 0,
          _id: imageId.toString()
        })
        .expect(200)
        .expect('Content-Type', /json/)
      })
      .then(function(res) {
        const { res: { text } } = res
        let obj
        try{
          obj = JSON.parse(text)
        }catch(_) {
          console.log(_)
        }
        responseExpect(obj, (target) => {
          target.forEach(item => {
            expect(item.complete).to.be.false
            expect(item.error).to.be.true
            expect(item.exists).to.be.false
          })
        })
      })
      .then(_ => {
        return ImageModel.updateOne({
          _id: imageId.toString()
        }, {
          $set: { src: filePath }
        })
      })
      .then(_ => {
        done()
      })
      .catch(err => {
        console.log('oops: ', err)
        done(err)
      })

    })

  })

  describe(`get the media valid fail test -> ${COMMON_API}`, function() {

    it(`get the media valid fail because lack of the type params`, function(done) {

      Request
      .get(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
        _id: imageId.toString()
      })
      .expect(400)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        done()
      })

    })

    it(`get the media valid fail because the type params is not valid`, function(done) {

      Request
      .get(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
        _id: imageId.toString(),
        type: 3
      })
      .expect(400)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        done()
      })

    })

    it(`get the media valid fail because lack of the _id params`, function(done) {

      Request
      .get(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
        type: 0
      })
      .expect(400)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        done()
      })

    })

    it(`get the media valid fail because the type params is not valid`, function(done) {

      Request
      .get(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
        _id: imageId.toString().slice(1),
        type: 0
      })
      .expect(400)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        done()
      })

    })

  })

})