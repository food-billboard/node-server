require('module-alias/register')
const { expect } = require('chai')
const { mockCreateUser, Request, mockCreateImage, STATIC_FILE_PATH } = require('@test/utils')
const { ImageModel, fileEncoded } = require('@src/utils')
const fs = require('fs')
const root = require('app-root-path')
const path = require('path')

const COMMON_API = '/api/customer/upload'

describe(`${COMMON_API} test`, function() {

  let userDatabase
  let selfToken
  let userId
  let mediaPath = path.resolve(root.path, 'test/assets/test-image.png')
  let mediaBigPath = path.resolve(root.path, 'test/assets/test-big.jpg')
  let littleImageName
  let bigImageName 
  let bigFile
  let littleFile
  
  before(async function() {

    const { model, token } = mockCreateUser({
      username: COMMON_API,
    })
    
    userDatabase = model
    selfToken = token

    await userDatabase.save()
    .then(data => {
      userId = data._id
    })
    .then(_ => {
      littleFile = fs.readFileSync(mediaPath, { encoding: 'base64' })
      bigFile = fs.readFileSync(mediaBigPath, { encoding: 'base64' })
      littleImageName = fileEncoded(littleFile)
      bigImageName = fileEncoded(bigFile)
    })
    .catch(err => {
      console.log('oops: ', err)
    })

    return Promise.resolve()

  })

  after(async function() {

    await Promise.all([
      userDatabase.deleteOne({
        username: COMMON_API
      }),
      ImageModel.deleteMany({
        name: COMMON_API
      }),
      new Promise((resolve, reject) => {
        fs.unlink(path.resolve(STATIC_FILE_PATH, 'public/image', littleImageName), (err) => {
          if(err) reject(err)
          resolve()
        })
      }),
      new Promise((resolve, reject) => {
        fs.unlink(path.resolve(STATIC_FILE_PATH, 'public/image', bigImageName), (err) => {
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

  describe(`pre check the token test -> ${COMMON_API}`, function() {

    describe(`pre check the token fail test -> ${COMMON_API}`, function() {

      it(`pre check the token fail because not found the params of token`, function(done) {

        Request
        .post(COMMON_API)
        .expect({
          Accept: 'application/json',
        })
        .expect(401)
        .expect({
          'Content-Type': /json/
        })
        .end(function(err) {
          if(err) return done(err)
          done()
        })

      })

      it(`pre check the token fail because the token is not verify or delay`, function(done) {

        this.timeout(11000)

        Request
        .post(COMMON_API)
        .expect({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(401)
        .expect({
          'Content-Type': /json/
        })
        .end(function(err) {
          if(err) return done(err)
          done()
        })

      })

    })

  })

  describe(`pre check the params of file is correct -> ${COMMON_API}`, function() {

    describe(`pre check the params of file is correct fail test ->${COMMON_API}`, function() {

      it(`pre check the params of file is correct fail because no file in params`, function(done) {

        Request
        .post(COMMON_API)
        .expect({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(400)
        .expect({
          'Content-Type': /json/
        })
        .end(function(err) {
          if(err) return done(err)
          done()
        })

      })

      // it(`pre check the params of file is correct fail because the file and type is File is not correct`, function(done) {

      //   Request
      //   .post(COMMON_API)
      //   .attach('file', mediaPath)
      //   .expect({
      //     Accept: 'application/json',
      //     Authorization: `Basic ${selfToken}`
      //   })
      //   .expect(400)
      //   .expect({
      //     'Content-Type': /json/
      //   })
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
        .expect({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(400)
        .expect({
          'Content-Type': /json/
        })
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
          files: [ { file: bigFile, name: COMMON_API } ]
        })
        .expect({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(413)
        .expect({
          'Content-Type': /json/
        })
        .end(function(err) {
          if(err) return done(err)
          done()
        })

      })

      it(`pre check the file size fail because the file of File size is too large`, function(done) {

        Request
        .post(COMMON_API)
        .attach(COMMON_API, mediaBigPath)
        .expect({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(413)
        .expect({
          'Content-Type': /json/
        })
        .end(function(err) {
          if(err) return done(err)
          done()
        })

      })

    })

  })


  describe(`post the little size file test -> ${COMMON_API}`, function() {

    describe(`post the little size file success test -> ${COMMON_API}`, function() {

      after(function(done) {
        ImageModel.find({
          name: COMMON_API
        })
        .select({
          _id: 1
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

      it(`post the little size file and send base64 file success`, function(done) {

        Request
        .post(COMMON_API)
        .send({
          files: [
            { 
              file: littleFile, 
              name: COMMON_API
            }
          ]
        })
        .expect({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(200)
        .expect({
          'Content-Type': /json/
        })
        .end(function(err) {
          if(err) return done(err)
          done()
        })

      })

      it(`post the little size file and send file success`, function(done) {

        Request
        .post(COMMON_API)
        .attach(COMMON_API, mediaPath)
        .expect({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(200)
        .expect({
          'Content-Type': /json/
        })
        .end(function(err) {
          if(err) return done(err)
          done()
        })

      })

    })

    describe(`post the little size file success and the file is exist before test -> ${COMMON_API}`, function() {

      let testMediaPath
      
      before(function(done) {

        testMediaPath = path.resolve(STATIC_FILE_PATH, 'public/image', `${littleImageName}.png`)

        const { model } = mockCreateImage({
          src: testMediaPath,
          name: COMMON_API,
          origin_type: 'USER',
          origin: userId,
          auth: 'PUBLIC',
          info: {
            md5: littleImageName,
            mime: 'image/png'
          }
        })

        model.save()
        .then(data => {
          let exists = false
          try {
            if(fs.statSync(testMediaPath).isFile()) {
              exists = true
            }
          }catch(err) {
            console.log('oops: ', err)
            done(err)
          }finally {
            if(!exists) {
              fs.writeFile(testMediaPath, data, function(err) {
                if(err) return done(err)
                done()
              })
            }else {
              done()
            }
          }
        })

      })

      after(function(done) {
        ImageModel.find({
          name: COMMON_API
        })
        .select({
          _id: 1
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
              file: littleFile, 
              name: COMMON_API
            }
          ]
        })
        .expect({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(200)
        .expect({
          'Content-Type': /json/
        })
        .end(function(err) {
          if(err) return done(err)
          done()
        })

      })

      it(`post the little size file and the type is File success and the file is exist before`, function(done) {

        Request
        .post(COMMON_API)
        .attach(COMMON_API, mediaPath)
        .expect({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(200)
        .expect({
          'Content-Type': /json/
        })
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
          console.log('oops: ', err)
          done(err)
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
          _id: 1
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
              file: littleFile, 
              name: COMMON_API
            }
          ]
        })
        .expect({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(200)
        .expect({
          'Content-Type': /json/
        })
        .end(function(err) {
          if(err) return done(err)
          done()
        })

      })

      it(`post the little size file and the type is File success and the file is exist before`, function(done) {

        Request
        .post(COMMON_API)
        .attach(COMMON_API, mediaPath)
        .expect({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(200)
        .expect({
          'Content-Type': /json/
        })
        .end(function(err) {
          if(err) return done(err)
          done()
        })

      })

    })

  })

})
