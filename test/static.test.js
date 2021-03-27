require('module-alias/register')
const { expect } = require('chai')
const { mockCreateUser, mockCreateImage, Request, mockCreateVideo, generateTemplateFile } = require('@test/utils')
const { ImageModel, fileEncoded, UserModel, VideoModel, STATIC_FILE_PATH } = require('@src/utils')
const fs = require('fs')
const path = require('path')

const templatePath = path.resolve(__dirname, 'assets')
let LITTLE_PUBLIC_COMMON_API = 'little-public';
let LITTLE_PRIVATE_COMMON_API = 'little-private';
let LARGE_PUBLIC_COMMON_API = 'large-public';
let LARGE_PRIVATE_COMMON_API = 'large-private';

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

  let littleFile;
  let bigFile;
  let littleFileName;
  let bigFileName;
  let littleFileStat;
  let bigFileStat;
  let COMMON_API;

  before(async function() {

    await generateTemplateFile()
    littleFile = fs.readFileSync(path.resolve(templatePath, 'test-image.png'))
    bigFile = fs.readFileSync(path.resolve(templatePath, 'test-video.mp4'))
    littleFileName = fileEncoded(littleFile)
    bigFileName = fileEncoded(bigFile)
    littleFileStat = fs.statSync(path.resolve(templatePath, 'test-image.png'))
    bigFileStat = fs.statSync(path.resolve(templatePath, 'test-video.mp4'))
    LITTLE_PUBLIC_COMMON_API = `${COMMON_API}/public/image/${littleFileName}.png`
    LITTLE_PRIVATE_COMMON_API = `${COMMON_API}/private/image/${littleFileName}.png`
    LARGE_PUBLIC_COMMON_API = `${COMMON_API}/public/video/${bigFileName}.mp4`
    LARGE_PRIVATE_COMMON_API = `${COMMON_API}/private/video/${bigFileName}.mp4`

    let res = true

    //测试文件写入
    //public
    fs.writeFileSync(path.resolve(STATIC_FILE_PATH, 'public/image', `${littleFileName}.png`), littleFile)
    const publicReadStream = fs.createReadStream(path.resolve(templatePath, 'test-video.mp4'))
    const publicWriteStream = fs.createWriteStream(path.resolve(STATIC_FILE_PATH, 'public/video', `${bigFileName}.mp4`))
    publicReadStream.pipe(publicWriteStream)
    await new Promise((resolve, reject) => {
      publicReadStream.on('end', function(err, res) {
        if(err) return reject(err)
        resolve(res)
      })
    })
    .catch(err => {
      console.log(err)
      res = false
    })
    //private
    fs.writeFileSync(path.resolve(STATIC_FILE_PATH, 'private/image', `${littleFileName}.png`), littleFile)
    const privateReadStream = fs.createReadStream(path.resolve(templatePath, 'test-video.mp4'))
    const privateWriteStream = fs.createWriteStream(path.resolve(STATIC_FILE_PATH, 'private/video', `${bigFileName}.mp4`))
    privateReadStream.pipe(privateWriteStream)
    await new Promise((resolve, reject) => {
      privateReadStream.on('end', function(err, res) {
        if(err) return reject(err)
        resolve(res)
      })
    })
    .catch(err => {
      console.log(err)
      res = false
    })

    //临时测试用户录入
    const { model: user, token, signToken: getToken } = mockCreateUser({
      username: COMMON_API
    })

    selfToken = token
    signToken = getToken

    await user.save()
    .then(function(data) {
      userId = data._id
      res = true
    })
    .catch(err => {
      console.log('oops: ', err)
      res = false
    })

    return res ? Promise.resolve() : Promise.reject(COMMON_API)

  })

  after(async function() {

    let res = true

    await Promise.all([
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
    .catch(err => {
      console.log('oops: ', err)
      res = false
    })

    try {
      const staticVPubPath = path.resolve(STATIC_FILE_PATH, 'public/video', `${bigFileName}.mp4`)
      const staticVPriPath = path.resolve(STATIC_FILE_PATH, 'private/video', `${bigFileName}.mp4`)
      const staticIPubPath = path.resolve(STATIC_FILE_PATH, 'public/image', `${littleFileName}.png`)
      const staticIPriPath = path.resolve(STATIC_FILE_PATH, 'private/image', `${littleFileName}.png`)
      if(fs.existsSync(staticVPubPath)) {
        fs.unlinkSync(staticVPubPath)
      }
      if(fs.existsSync(staticVPriPath)) {
        fs.unlinkSync(staticVPriPath)
      }
      if(fs.existsSync(staticIPubPath)) {
        fs.unlinkSync(staticIPubPath)
      }
      if(fs.existsSync(staticIPriPath)) {
        fs.unlinkSync(staticIPriPath)
      }
    }catch(err){
      console.log('oops: ', err)
      res = false
    }

    return res ? Promise.resolve() : Promise.reject(LITTLE_PUBLIC_COMMON_API)

  })

  beforeEach(function(done) {
    selfToken = signToken()
    done()
  })

  describe(`get the little test -> ${LITTLE_PUBLIC_COMMON_API} -> ${LITTLE_PRIVATE_COMMON_API}`, function() {

    describe(`get the little success success test -> ${LITTLE_PUBLIC_COMMON_API} -> ${LITTLE_PRIVATE_COMMON_API}`, function() {      

      it(`get the little file success and is public and not login`, async function() {

        let res = true

        const filePath = path.resolve(STATIC_FILE_PATH, 'public/image', `${littleFileName}.png`)

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
            src: LITTLE_PUBLIC_COMMON_API,
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
        .then(data => {
          const { body } = data
          expect(body.byteLength).to.be.equals(littleFileStat.size)
        })

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
            src: LITTLE_PUBLIC_COMMON_API,
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
        .then(data => {
          const { body } = data
          expect(body.byteLength).to.be.equals(littleFileStat.size)
        })

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
          "info.md5": littleFileName,
          src: LITTLE_PRIVATE_COMMON_API
        })
        .select({
          _id: 1
        })
        .exec()
        .then(data => {
          if(!!data) return
          const { model } = mockCreateImage({
            name: littleFileName,
            src: LITTLE_PRIVATE_COMMON_API,
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
        .then(data => {
          const { body } = data
          expect(body.byteLength).to.be.equals(littleFileStat.size)
        })

        return res ? Promise.resolve() : Promise.reject(COMMON_API)

      })

      it(`get the little file success and the file is public and exixts and database is not found`, async function() {

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
          "info.md5": littleFileName,
          src: LITTLE_PUBLIC_COMMON_API
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
        .then(data => {
          const { body } = data
          expect(body.byteLength).to.be.equals(littleFileStat.size)
        })

        return res ? Promise.resolve() : Promise.reject(COMMON_API)

      })

    })

    describe(`get the little file fail test -> ${LITTLE_PRIVATE_COMMON_API}`, function() {

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

        await Request
        .get(`${LITTLE_PUBLIC_COMMON_API.split('.')[0]}.jpg`)
        .set({
          Accept: 'image/png',
          Authorization: `Basic ${selfToken}`
        })
        .expect(404)

        return res ? Promise.resolve() : Promise.reject()

      })

    })

  })

  describe(`get the large file test -> ${LARGE_PUBLIC_COMMON_API}`, function() {

    before(function(done) {
      // try {
      //   if(!fs.existsSync(path.resolve(STATIC_FILE_PATH, 'public/video', `${bigFileName}.mp4`))) {
        
      //   }
      // }catch(err) {
      //   console.log('oops: ', err)
      //   done(err)
      // }

      const { model } = mockCreateVideo({
        name: bigFileName,
        src: LARGE_PUBLIC_COMMON_API,
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

    describe(`get the large file success test -> ${LARGE_PUBLIC_COMMON_API}`, function() {

      it(`get the large file success`, function(done) {

        Request
        .get(LARGE_PUBLIC_COMMON_API)
        .set({
          Accept: 'video/mp4',
          Authorization: `Basic ${selfToken}`,
          Range: `bytes=0-512000/${bigFileStat.size}`
        })
        .expect(206)
        .expect('Content-Type', /mp4/)
        .expect('Content-Length', "512000")
        .expect('Content-Range', `bytes 0-512000/${bigFileStat.size}`)
        .end(function(err) {
          if(err) return done(err)
          done()
        })

      })

      it(`get the large file success and return the status of 304`, function(done) {

        const stat = fs.statSync(path.join(STATIC_FILE_PATH, 'public/video', `${bigFileName}.mp4`))

        Request
        .get(LARGE_PUBLIC_COMMON_API)
        .set({
          Accept: 'video/mp4',
          Authorization: `Basic ${selfToken}`,
          'IF-None-Match': bigFileName,
          "If-Modified-Since": new Date(stat.mtimeMs).toString()
        })
        .expect(304)
        .expect('Last-Modified', new Date(stat.mtimeMs).toString())
        .expect('ETag', bigFileName)
        .end(function(err) {
          if(err) return done(err)
          done()
        })

      })

      it(`get the large file success and hope return the status of 304 but the file is updated`, function(done) {

        const stat = fs.statSync(path.join(STATIC_FILE_PATH, 'public/video', `${bigFileName}.mp4`))
        
        Request
        .get(LARGE_PUBLIC_COMMON_API)
        .set({
          Accept: 'video/mp4',
          Authorization: `Basic ${selfToken}`,
          'IF-None-Match': bigFileName,
          "If-Modified-Since": new Date(stat.mtimeMs - 111111111)
        })
        .expect(206)
        .expect('Content-Type', /mp4/)
        .expect('Content-Length', "512000")
        .expect('Content-Range', `bytes 0-512000/${bigFileStat.size}`)
        .expect('Last-Modified', new Date(stat.mtimeMs).toString())
        .expect('ETag', bigFileName)
        .end(function(err) {
          if(err) return done(err)
          done()
        })
        
      })

    })

    describe(`get the large file fail test -> ${LARGE_PUBLIC_COMMON_API}`, function() {

      it(`get the larage file fail because the range header is not verify`, function(done) {

        Request
        .get(LARGE_PUBLIC_COMMON_API)
        .set({
          Accept: 'video/mp4',
          Authorization: `Basic ${selfToken}`,
          Range: `bytes=0-0/${bigFileStat.size}`
        })
        .expect(416)
        .expect('Content-Type', /json/)
        // .expect('Content-Range', `bytes 0-512000/${bigFileStat.size}`)
        .end(function(err) {
          if(err) return done(err)
          done()
        })

      })

    })

  })

})

