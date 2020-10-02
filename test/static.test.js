require('module-alias/register')
const { expect } = require('chai')
const { mockCreateUser, mockCreateImage, Request, mockCreateVideo } = require('@test/utils')
const { ImageModel, fileEncoded, UserModel, VideoModel, STATIC_FILE_PATH } = require('@src/utils')
const fs = require('fs')
const root = require('app-root-path')
const path = require('path')

const templatePath = path.resolve(__dirname, 'assets')
const littleFile = fs.readFileSync(path.resolve(templatePath, 'test-image.png'))
const bigFile = fs.readFileSync(path.resolve(templatePath, 'test-video.mp4'))
const littleFileName = fileEncoded(littleFile)
const bigFileName = fileEncoded(bigFile)
const littleFileStat = fs.statSync(path.resolve(templatePath, 'test-image.png'))
const bigFileStat = fs.statSync(path.resolve(templatePath, 'test-video.mp4'))
const COMMON_API = '/api/static/'
const LITTLE_PUBLIC_COMMON_API = `${COMMON_API}image/public/${littleFileName}.png`
const LITTLE_PRIVATE_COMMON_API = `${COMMON_API}image/private/${littleFileName}.png`
const LARGE_PUBLIC_COMMON_API = `${COMMON_API}video/public/${bigFileName}.mp4`
const LARGE_PRIVATE_COMMON_API = `${COMMON_API}video/private/${bigFileName}.mp4`

function responseExpect(res, validate=[]) {

  const { res: { data: target } } = res

  if(Array.isArray(validate)) {
    validate.forEach(valid => {
      typeof valid == 'function' && valid(target)
    })
  }else if(typeof validate == 'function') {
    validate(target)
  }
}

describe(`${LITTLE_PUBLIC_COMMON_API} or ${LITTLE_PRIVATE_COMMON_API} or ${LARGE_PUBLIC_COMMON_API} or ${LARGE_PRIVATE_COMMON_API} test`, function() {

  let userId
  let selfToken
  let signToken

  before(function(done) {

    const { model: user, token, signToken: getToken } = mockCreateUser({
      username: COMMON_API
    })

    selfToken = token
    signToken = getToken

    user.save()
    .then(function(data) {
      userId = data._id
      done()
    })
    .catch(err => {
      console.log('oops: ', err)
    })

  })

  after(function(done) {

    Promise.all([
      UserModel.deleteMany({
        username: COMMON_API
      }),
      ImageModel.deleteMany({
        "info.md5": littleFileName
      }),
      VideoModel.deleteMany({
        "info.md5": bigFileName
      })
    ])
    .then(_ => {
      try {
        fs.unlinkSync(path.resolve(STATIC_FILE_PATH, 'video/public', `${bigFileName}.mp4`))
        fs.unlinkSync(path.resolve(STATIC_FILE_PATH, 'video/private', `${bigFileName}.mp4`))
        fs.unlinkSync(path.resolve(STATIC_FILE_PATH, 'image/public', `${littleFileName}.png`))
        fs.unlinkSync(path.resolve(STATIC_FILE_PATH, 'image/private', `${littleFileName}.png`))
      }catch(err){
        console.log(err)
      }
    })
    .then(_ => {
      done()
    })
    .catch(err => {
      console.log('oops: ', err)
    })

  })

  beforeEach(function(done) {
    selfToken = signToken()
    done()
  })

  describe(`get the little test -> ${LITTLE_PUBLIC_COMMON_API} -> ${LITTLE_PRIVATE_COMMON_API}`, function() {

    describe(`get the little success success test -> ${LITTLE_PUBLIC_COMMON_API} -> ${LITTLE_PRIVATE_COMMON_API}`, function() {      

      it(`get the little file success and is public and not login`, async function() {

        let res = true

        const filePath = path.resolve(STATIC_FILE_PATH, 'public', `${littleFileName}.png`)

        try {
          if(!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, littleFile)
          }
        }catch(err) {
          console.log('oops: ', err)
          res = false
        }

        await ImageModel.findOne({
          "info.md5": littleFileName
        })
        .select({
          _id: 1
        })
        .exec()
        .then(data => {
          if(!!data) return
          const { model } = mockCreateImage({
            name: littleFileName,
            src: `/static${LITTLE_PUBLIC_COMMON_API.split('static')[1]}`,
            white_list: [],
            auth: 'PUBLIC',
            origin_type: 'USER',
            info: {
              md5: littleFileName,
              mime: 'image/png',
              complete: [0],
              status: 'COMPLETE',
              chunk_size: 1,
              size: littleFileStat.size
            }
          })
          return model.save()
        })
        .catch(err => {
          console.log('oops: ', err)
          res = false
        })

        await Request
        .get(LITTLE_PUBLIC_COMMON_API)
        .set({
          Accept: 'image/png'
        })
        .expect(200)
        .expect('Content-Type', /png/)

        return res ? Promise.resolve() : Promise.reject(COMMON_API)

      })

      it(`get the little file success and is public and login`, async function() {

        let res = true

        const filePath = path.resolve(STATIC_FILE_PATH, 'public', `${littleFileName}.png`)

        try {
          if(fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, littleFile)
          }
        }catch(err) {
          console.log('oops: ', err)
          res = false
        }

        await ImageModel.findOne({
          "info.md5": littleFileName
        })
        .select({
          _id: 1
        })
        .exec()
        .then(data => {
          if(!!data) return
          const { model } = mockCreateImage({
            name: littleFileName,
            src: `/static${LITTLE_PUBLIC_COMMON_API.split('static')[1]}`,
            white_list: [],
            auth: 'PUBLIC',
            origin_type: 'USER',
            info: {
              md5: littleFileName,
              mime: 'image/png',
              complete: [0],
              status: 'COMPLETE',
              chunk_size: 1,
              size: littleFileStat.size
            }
          })
          return model.save()
        })
        .catch(err => {
          console.log('oops: ', err)
          res = false
        })

        await Request
        .get(LITTLE_PUBLIC_COMMON_API)
        .set({
          Accept: 'image/png',
          Authorization: `Basic ${selfToken}`
        })
        .expect(200)
        .expect('Content-Type', /png/)

        return res ? Promise.resolve() : Promise.reject(COMMON_API)

      })

      it(`get the little file success and is private and login`, async function() {

        let res = true

        const filePath = path.resolve(STATIC_FILE_PATH, 'private', `${littleFileName}.png`)

        try {
          if(fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, littleFile)
          }
        }catch(err) {
          console.log('oops: ', err)
          res = false
        }

        await ImageModel.findOne({
          "info.md5": littleFileName
        })
        .select({
          _id: 1
        })
        .exec()
        .then(data => {
          if(!!data) return
          const { model } = mockCreateImage({
            name: littleFileName,
            src: `/static${LITTLE_PUBLIC_COMMON_API.split('static')[1]}`,
            white_list: [ userId ],
            auth: 'PRIVATE',
            origin_type: 'USER',
            info: {
              md5: littleFileName,
              mime: 'image/png',
              complete: [0],
              status: 'COMPLETE',
              chunk_size: 1,
              size: littleFileStat.size
            }
          })
          return model.save()
        })
        .catch(err => {
          console.log('oops: ', err)
          res = false
        })

        await Request
        .get(LITTLE_PRIVATE_COMMON_API)
        .set({
          Accept: 'image/png',
          Authorization: `Basic ${selfToken}`
        })
        .expect(200)
        .expect('Content-Type', /png/)

        return res ? Promise.resolve() : Promise.reject(COMMON_API)

      })

      it(`get the little file success and the file is exixts and database is not found`, async function() {

        let res = true

        const filePath = path.resolve(STATIC_FILE_PATH, 'public', `${littleFileName}.png`)

        try {
          if(fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, littleFile)
          }
        }catch(err) {
          console.log('oops: ', err)
          res = false
        }

        await ImageModel.deleteMany({
          "info.md5": littleFileName
        })
        .catch(err => {
          console.log('oops: ', err)
          res = false
        })

        await Request
        .get(LITTLE_PRIVATE_COMMON_API)
        .set({
          Accept: 'image/png',
          Authorization: `Basic ${selfToken}`
        })
        .expect(200)
        .expect('Content-Type', /png/)

        return res ? Promise.resolve() : Promise.reject(COMMON_API)

      })

    })

    describe(`get the little file fail test -> ${LITTLE_COMMON_API}`, function() {

      beforeEach(function(done) {
        const filePath = path.resolve(STATIC_FILE_PATH, 'private', `${littleFileName}.png`)
        try {
          if(fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, littleFile)
          }
        }catch(err) {
          console.log('oops: ', err)
        }

        ImageModel.updateOne({
          "info.md5": littleFileName
        }, {
          white_list: [userId]
        })
        .then(_ => {
          done()
        })
        .catch(err => {
          console.log('oops: ', err)
        })

      })

      it(`get the little file fail because the file is private and not login`, function(done) {

        Request
        .get(LITTLE_PRIVATE_COMMON_API)
        .set({
          Accept: 'image/png',
        })
        .expect(403)
        .end(function(err) {
          if(err) return done(err)
          done()
        })

      })

      it(`get the little file fail because the file is private and not allow this user get`, async function() {

        let res = true

        await ImageModel.updateOne({
          "info.md5": littleFileName
        }, {
          white_list: []
        })
        .catch(err => {
          console.log('oops: ', err)
          res = false
        })

        await Request
        .get(LITTLE_PRIVATE_COMMON_API)
        .set({
          Accept: 'image/png',
          Authorization: `Basic ${selfToken}`
        })
        .expect(403)

        return res ? Promise.resolve() : Promise.reject(COMMON_API)

      })

      it(`get the little file fail because the file is private and the database is not found`, async function() {

        let res = true

        await ImageModel.deleteMany({
          "info.md5": littleFileName
        })
        .catch(err => {
          res = false
          console.log('oops: ', err)
        })

        await Request
        .get(LITTLE_PRIVATE_COMMON_API)
        .set({
          Accept: 'image/png',
          Authorization: `Basic ${selfToken}`
        })
        .expect(404)

        return res ? Promise.resolve() : Promise.reject()

      })

      it(`get the little file fail because the file is not found`, async function() {

        let res = true

        try {
          fs.unlinkSync(path.resolve(STATIC_FILE_PATH, 'public', `${littleFileName}.png`))
        }catch(err) {
          done(err)
        }

        await Request
        .get(LITTLE_PUBLIC_COMMON_API)
        .set({
          Accept: 'image/png',
          Authorization: `Basic ${selfToken}`
        })
        .expect(404)

        return res ? Promise.resolve() : Promise.reject()

      })

    })

  })

  describe(`get the large file test -> ${LARGE_COMMON_API}`, function() {

    before(function(done) {
      try {
        if(!fs.existsSync(path.resolve(STATIC_FILE_PATH, 'public/video', `${bigFileName}.mp4`))) {
        
        }
      }catch(err) {
        console.log('oops: ', err)
        done(err)
      }

      const { model } = mockCreateVideo({
        name: bigFileName,
        src: `/static${LARGE_PUBLIC_COMMON_API.split('static')[1]}`,
        white_list: [ userId ],
        auth: 'PUBLIC',
        origin_type: 'USER',
        info: {
          md5: bigFileName,
          mime: 'video/mp4',
          complete: new Array(Math.ceil(bigFileStat.size / 500)).fill(0).map((_, index) => index),
          status: 'COMPLETE',
          chunk_size: Math.ceil(bigFileStat.size / 500),
          size: bigFileStat.size
        }
      })

      model.save()
      .then(_ => {
        done()
      })
      .catch(err => {
        done(err)
        console.log('oops: ', err)
      })

    })

    describe(`get the large file success test -> ${LARGE_COMMON_API}`, function() {

      it(`get the large file success`, function(done) {

        Request
        .get(LARGE_PUBLIC_COMMON_API)
        .set({
          Accept: 'video/mp4',
          Authorization: `Basic ${selfToken}`,
          Range: `bytes 0-500/${bigFileStat.size}`
        })
        .expect(206)
        .expect('Content-Type', /mp4/)
        .expect('Content-Length', 500)
        .expect('Content-Rage', `bytes 0-500/${bigFileStat.size}`)
        .end(function(err) {
          if(err) return done(err)
          done()
        })

      })

      it(`get the large file success and return the status of 304`, function(done) {

        Request
        .get(LARGE_PUBLIC_COMMON_API)
        .set({
          Accept: 'video/mp4',
          Authorization: `Basic ${selfToken}`,
          'IF-None-Match': bigFileName,
          "If-Modified-Since": bigFileStat.mtime
        })
        .expect(304)
        .expect('Content-Type', /mp4/)
        .expect('Content-Rage', `bytes 0-500/${bigFileStat.size}`)
        .expect('Last-Modified', bigFileStat.mtime)
        .expect('ETag', bigFileName)
        .end(function(err) {
          if(err) return done(err)
          done()
        })

      })

      it(`get the large file success and hope return the status of 304 but the file is updated`, function(done) {
        
        Request
        .get(LARGE_PUBLIC_COMMON_API)
        .set({
          Accept: 'video/mp4',
          Authorization: `Basic ${selfToken}`,
          'IF-None-Match': bigFileName,
          "If-Modified-Since": bigFileStat.mtimeMs - 100000
        })
        .expect(200)
        .expect('Content-Type', /mp4/)
        .expect('Content-Length', 500)
        .expect('Content-Rage', `bytes 0-500/${bigFileStat.size}`)
        .expect('Last-Modified', bigFileStat.mtime)
        .expect('ETag', bigFileName)
        .end(function(err) {
          if(err) return done(err)
          done()
        })
        
      })

    })

    describe(`get the large file fail test -> ${LARGE_COMMON_API}`, function() {

      it(`get the larage file fail because the range header is not verify`, function(done) {

        Request
        .get(LARGE_PUBLIC_COMMON_API)
        .set({
          Accept: 'video/mp4',
          Authorization: `Basic ${selfToken}`,
        })
        .expect(416)
        .expect('Content-Type', /mp4/)
        .expect('Content-Rage', `bytes 0-500/${bigFileStat.size}`)
        .end(function(err) {
          if(err) return done(err)
          done()
        })

      })

    })

  })

})

