require('module-alias/register')
const { expect } = require('chai')
const { mockCreateUser, Request } = require('@test/utils')
const { ImageModel, fileEncoded, UserModel, STATIC_FILE_PATH } = require('@src/utils')
const fs = require('fs')
const root = require('app-root-path')
const path = require('path')

const COMMON_API = '/api/customer/upload'

describe(`${COMMON_API} test`, function() {

  let selfToken
  let userId
  let mediaPath = path.resolve(root.path, 'test/assets/test-image.png')
  let mediaBigPath = path.resolve(root.path, 'test/assets/test-big.jpg')
  let littleImageName
  let bigImageName 
  let bigFile
  let littleFile
  let littleBase64File
  let bigBase64File
  let signToken
  
  before(async function() {

    const { model, token, signToken:getToken } = mockCreateUser({
      username: COMMON_API,
    })
    
    selfToken = token
    signToken = getToken

    await model.save()
    .then(data => {
      userId = data._id
    })
    .then(_ => {
      littleFile = fs.readFileSync(mediaPath, { encoding: 'base64' })
      littleBase64File = `data:image/png;base64,${littleFile}`
      bigFile = fs.readFileSync(mediaBigPath, { encoding: 'base64' })
      bigBase64File = `data:image/jpg;base64,${bigFile}`
      const buffer1 = new Buffer.from(littleFile, 'base64')
      const buffer2 = new Buffer.from(bigFile, 'base64')
      littleImageName = fileEncoded(buffer1)
      bigImageName = fileEncoded(buffer2)
    })
    .catch(err => {
      console.log('oops: ', err)
    })

    return Promise.resolve()

  })

  after(async function() {

    await Promise.allSettled([
      UserModel.deleteMany({
        username: COMMON_API
      }),
      ImageModel.deleteMany({
        "info.md5": littleImageName
      }),
      new Promise((resolve, reject) => {
        fs.unlink(path.resolve(STATIC_FILE_PATH, 'public/image', `${littleImageName}.png`), (err) => {
          if(err) reject(err)
          resolve()
        })
      }),
      new Promise((resolve, reject) => {
        fs.unlink(path.resolve(STATIC_FILE_PATH, 'public/image', `${bigImageName}.jpg`), (err) => {
          if(err) reject(err)
          resolve()
        })
      })
    ])
    .catch(err => {
      console.log('oops: ', err)
    })

    return Promise.resolve()

  })

  beforeEach(function() {
    selfToken = signToken()
  })

  describe(`pre check the token test -> ${COMMON_API}`, function() {

    describe(`pre check the token fail test -> ${COMMON_API}`, function() {

      it(`pre check the token fail because not found the params of token`, function(done) {

        Request
        .post(COMMON_API)
        .set({
          Accept: 'application/json',
        })
        .expect(401)
        .expect('Content-Type', /json/)
        .end(function(err) {
          if(err) return done(err)
          done()
        })

      })

      // it(`pre check the token fail because the token is not verify or delay`, async function() {

      //   await new Promise((resolve) => {
      //     setTimeout(() => {
      //       resolve()
      //     }, 6000)
      //   })

      //   await Request
      //   .post(COMMON_API)
      //   .set({
      //     Accept: 'application/json',
      //     Authorization: `Basic ${selfToken}`
      //   })
      //   .expect(401)
      //   .expect('Content-Type', /json/)

      //   return Promise.resolve()

      // })

    })

  })

  describe(`pre check the params of file is correct -> ${COMMON_API}`, function() {

    describe(`pre check the params of file is correct fail test ->${COMMON_API}`, function() {

      it(`pre check the params of file is correct fail because no file in params`, function(done) {

        Request
        .post(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(400)
        .expect('Content-Type', /json/)
        .end(function(err) {
          if(err) return done(err)
          done()
        })

      })

      // it(`pre check the params of file is correct fail because the file and type is File is not correct`, function(done) {

      //   Request
      //   .post(COMMON_API)
      //   .attach('file', mediaPath)
      //   .set({
      //     Accept: 'application/json',
      //     Authorization: `Basic ${selfToken}`
      //   })
      //   .expect(400)
      //   .expect('Content-Type', /json/)
      //   .end(function(err) {
      //     if(err) return done(err)
      //     done()
      //   })

      // })

      it(`pre check the params of file is correct fail because the file and type is base64 is not correct`, function(done) {

        Request
        .post(COMMON_API)
        .send({
          files: [ { file: 'base64', name: COMMON_API } ]
        })
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(400)
        .expect('Content-Type', /json/)
        .end(function(err) {
          if(err) return done(err)
          done()
        })

      })

    })

  })

  describe(`pre check the file size -> ${COMMON_API}`, function() {

    describe(`pre check the file size fail test ->${COMMON_API}`, function() {

      it(`pre check the file size fail because the file of base64 size is too large`, function(done) {

        Request
        .post(COMMON_API)
        .send({
          files: [ { file: bigBase64File, name: COMMON_API } ]
        })
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(413)
        .end(function(err) {
          if(err) return done(err)
          done()
        })

      })

      it(`pre check the file size fail because the file of File size is too large`, function(done) {

        Request
        .post(COMMON_API)
        .attach(COMMON_API, mediaBigPath)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(413)
        .expect('Content-Type', /json/)
        .end(function(err) {
          if(err) return done(err)
          done()
        })

      })

    })

  })


  describe(`post the little size file test -> ${COMMON_API}`, function() {

    describe(`post the little size file success test -> ${COMMON_API}`, function() {

      before(function(done) {
        ImageModel.deleteMany({
          "info.md5": littleImageName
        })
        .then(function() {
          done()
        })
      })

      after(function(done) {
        ImageModel.find({
          "info.md5": littleImageName
        })
        .select({
          _id: 1,
          info: 1
        })
        .exec()
        .then(data => !!data && data)
        .then(data => {
          expect(data).to.be.a('array').and.that.lengthOf(1)
          done()
        })
        .catch(err => {
          console.log('oops: ', err)
          done(err)
        })
      })

      it(`post the little size file and send base64 file success`, function(done) {

        Request
        .post(COMMON_API)
        .send({
          files: [
            { 
              file: littleBase64File, 
              name: COMMON_API
            }
          ]
        })
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err) {
          if(err) return done(err)
          done()
        })

      })

      it(`post the little size file and send file success`, function(done) {

        Request
        .post(COMMON_API)
        .attach(COMMON_API, mediaPath)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err) {
          if(err) return done(err)
          done()
        })

      })

    })

    describe(`post the little size file success and the file is exist before test -> ${COMMON_API}`, function() {

      let exists = false

      let testMediaPath 
      
      before(function(done) {

        testMediaPath = path.resolve(STATIC_FILE_PATH, 'public/image', `${littleImageName}.png`)

        try {
          if(fs.statSync(testMediaPath).isFile()) {
            exists = true
          }
        }catch(err) {
          console.log('indeterminacy oops: ', err)
        }finally {
          if(!exists) {
            fs.writeFile(testMediaPath, littleFile, function(err) {
              if(err) return done(err)
              done()
            })
          }else {
            done()
          }
        }

      })

      after(function(done) {
        ImageModel.find({
          name: COMMON_API
        })
        .select({
          _id: 1,
        })
        .exec()
        .then(data => !!data && data)
        .then(data => {
          expect(data).to.be.not.a('boolean').and.that.lengthOf(1)
          done()
        })
        .catch(err => {
          console.log('oops: ', err)
          done(err)
        })
      })

      it(`post the little size file and the type is base64 success and the file is exist before`, function(done) {

        Request
        .post(COMMON_API)
        .send({
          files: [
            { 
              file: littleBase64File, 
              name: COMMON_API
            }
          ]
        })
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err) {
          if(err) return done(err)
          done()
        })

      })

      it(`post the little size file and the type is File success and the file is exist before`, function(done) {

        Request
        .post(COMMON_API)
        .attach(COMMON_API, mediaPath)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err) {
          if(err) return done(err)
          done()
        })

      })

    })

  })

})
