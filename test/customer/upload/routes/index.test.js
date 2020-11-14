require('module-alias/register')
const { expect } = require('chai')
const { mockCreateUser, Request, mockCreateVideo } = require('@test/utils')
const { VideoModel, UserModel, fileEncoded, STATIC_FILE_PATH } = require('@src/utils')
const { MAX_FILE_SIZE } = require('@src/router/customer/upload/util')
const fs = require('fs')
const root = require('app-root-path')
const path = require('path')
const { Types: { ObjectId } } = require('mongoose')

const COMMON_API = '/api/customer/upload/chunk'

describe(`${COMMON_API} test`, function() {

  let userId
  let selfToken
  let signToken
  let mediaPath = path.resolve(root.path, 'test/assets/test-video.mp4')
  let file = fs.readFileSync(mediaPath)
  let filename = fileEncoded(file)
  let size = fs.statSync(mediaPath).size
  const templatePath = path.resolve(STATIC_FILE_PATH, 'template', filename)
  const realFilePath = path.resolve(STATIC_FILE_PATH, 'public/video', `${filename}.mp4`)
  const chunkSize = 1024 * 500
  let chunksLength = Math.ceil(size / chunkSize)
  let slice = Uint8Array.prototype.slice
  let chunks = new Array(chunksLength).fill(0).map((_, index) => {
    if(index + 1 === chunksLength) return slice.call(file, index * chunkSize )
    return slice.call(file, index * chunkSize, (index + 1) * chunkSize)
  })
  const suffix = 'video/mp4'
  const auth = 'PUBLIC'

  before(function(done) {

    if(!fs.existsSync(STATIC_FILE_PATH)) fs.mkdirSync(STATIC_FILE_PATH)
    if(!fs.existsSync(path.resolve(STATIC_FILE_PATH, 'template'))) fs.mkdirSync(path.resolve(STATIC_FILE_PATH, 'template'))
    if(!fs.existsSync(path.resolve(STATIC_FILE_PATH, 'public'))) fs.mkdirSync(path.resolve(STATIC_FILE_PATH, 'public'))
    if(!fs.existsSync(path.resolve(STATIC_FILE_PATH, 'private'))) fs.mkdirSync(path.resolve(STATIC_FILE_PATH, 'private'))
    if(!fs.existsSync(path.resolve(STATIC_FILE_PATH, 'public/image'))) fs.mkdirSync(path.resolve(STATIC_FILE_PATH, 'public/image'))
    if(!fs.existsSync(path.resolve(STATIC_FILE_PATH, 'public/video'))) fs.mkdirSync(path.resolve(STATIC_FILE_PATH, 'public/video'))
    if(!fs.existsSync(path.resolve(STATIC_FILE_PATH, 'private/image'))) fs.mkdirSync(path.resolve(STATIC_FILE_PATH, 'private/image'))
    if(!fs.existsSync(path.resolve(STATIC_FILE_PATH, 'private/video'))) fs.mkdirSync(path.resolve(STATIC_FILE_PATH, 'private/video'))

    const { model, token, signToken: getToken } = mockCreateUser({
      username: COMMON_API
    })

    signToken = getToken
    selfToken = token

    model.save()
    .then(data => {
      userId = data._id
      done()
    })
    .catch(err => {
      console.log('oops: ', err)
    })

  })

  after(async function() {

    const res = await Promise.all([
      UserModel.deleteMany({
        username: COMMON_API
      }),
      VideoModel.deleteMany({
        "info.md5": filename
      })
    ])
    .then(_ => {
      try {
        if(fs.existsSync(templatePath)) {
          const fileList = fs.readdirSync(templatePath)
          fileList.forEach(file => {
            const filePath = path.resolve(templatePath, file)
            if(fs.existsSync(filePath)) {
              fs.unlinkSync(filePath)
            }
          })
          fs.rmdirSync(templatePath)
        }
        if(fs.existsSync(realFilePath)) {
          fs.unlinkSync(realFilePath)
        }
      }finally {
        return true
      }
    })
    .catch(err => {
      console.log('oops: ', err)
      return false
    })

    return res ? Promise.resolve() : Promise.reject(COMMON_API)

  })

  beforeEach(function(done) {
    selfToken = signToken()
    done()
  })

  describe(`pre check the params -> ${COMMON_API}`, function() {

    describe(`pre check the params fail test -> ${COMMON_API}`, function() {

      it(`pre check params fail because the params of md5 is not verify`, function(done) {

        Request
        .post(COMMON_API)
        .send({
          name: COMMON_API,
          size: 1000
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

      it(`pre check params fail because the params of md5 is not found`, function(done) {

        Request
        .post(COMMON_API)
        .send({
          size: 1000
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

      it(`pre check params fail because the params of size is too large`, function(done) {

        Request
        .post(COMMON_API)
        .send({
          size: MAX_FILE_SIZE * 2,
          name: filename
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

      it(`pre check params fail because the params of size is not found`, function(done) {

        Request
        .post(COMMON_API)
        .send({
          name: filename,
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

  describe(`check the file is exists and adjust the database test -> ${COMMON_API}`, function() {

    describe(`check the file is exists and adjust the database success test -> ${COMMON_API}`, function() {

      beforeEach(function(done) {
        VideoModel.deleteMany({
          "info.md5": filename
        })
        .then(function() {
          if(fs.existsSync(realFilePath)) {
            fs.unlinkSync(realFilePath)
          }
        })
        .then(function() {
          done()
        })
        .catch(err => {
          console.log('oops: ', err)
          done(err)
        })
      })

      it(`check file is exists and adjust the database success and the file is exists and database is exists`, async function() {

        let res = true

        const { model } = mockCreateVideo({
          name: COMMON_API,
          src: `/static${realFilePath.split('static')[1]}`,
          white_list: [userId],
          info: {
            md5: filename,
            complete: new Array(chunksLength).fill(0).map((_, index) => index),
            status: "COMPLETE",
            chunk_size: chunksLength,
            size,
            mime: 'video/mp4'
          }
        })

        await Promise.all([
          VideoModel.findOne({
            "info.md5": filename
          })
          .select({
            _id: 1
          })
          .exec()
          .then(data => !!data)
          .then(data => {
            if(!data) return model.save()
            return false
          }),
          new Promise((resolve, reject) => {
            if(!fs.existsSync(realFilePath)) {
              fs.writeFileSync(realFilePath, '')
            }
            const writeStream = fs.createWriteStream(realFilePath)
            const readStream = fs.createReadStream(mediaPath)

            readStream.pipe(writeStream)

            readStream.on('end', function(err) {
              if(err) return reject(err)
              resolve()
            })
          })
        ])
        .catch(err => {
          console.log('oops: ', err)
          res = false
        })

        const data = await Request
        .get(COMMON_API)
        .query({
          size,
          name: filename,
          chunksLength,
          suffix, 
          chunkSize, 
          filename: COMMON_API, 
          auth
        })
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(200)
        .expect('Content-Type', /json/)

        //检查
        const { res: { text } } = data
        let obj
        try{
          obj = JSON.parse(text)
        }catch(_) {
          console.log(_)
          res = false
        }

        expect(obj.res.data).to.be.false

      })

      it(`check file is exists and adjust the database success and the file is not exists and the database is not exists`, async function() {

        const data = await Request
        .get(COMMON_API)
        .query({
          size,
          name: filename,
          chunksLength,
          suffix, 
          chunkSize, 
          filename: COMMON_API, 
          auth
        })
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(200)
        .expect('Content-Type', /json/)

        //检查
        const { res: { text } } = data
        let obj
        try{
          obj = JSON.parse(text)
        }catch(_) {
          console.log(_)
          res = false
        }
        expect(obj.res.data).to.be.a('array').and.that.lengthOf(0)

      })

      it(`check file is exists and adjust the database success and the file is not exists but the database is exists`, async function() {

        let res = true

        const { model } = mockCreateVideo({
          name: COMMON_API,
          src: `/static${realFilePath.split('static')[1]}`,
          white_list: [userId],
          info: {
            md5: filename,
            complete: new Array(chunksLength).fill(0).map((_, index) => index),
            status: "COMPLETE",
            chunk_size: chunksLength,
            size,
            mime: 'video/mp4'
          }
        })

        await VideoModel.findOne({
          "info.md5": filename
        })
        .select({
          _id: 1
        })
        .exec()
        .then(data => !!data)
        .then(data => {
          if(!data) return model.save()
          return false
        })
        .catch(err => {
          console.log('oops: ', err)
          res = false
        })
        

        const data = await Request
        .get(COMMON_API)
        .query({
          size: MAX_FILE_SIZE,
          name: filename,
          chunksLength,
          suffix, 
          chunkSize, 
          filename: COMMON_API, 
          auth
        })
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(200)
        .expect('Content-Type', /json/)

        const { res: { text } } = data
        let obj
        try{
          obj = JSON.parse(text)
        }catch(_) {
          console.log(_)
          res = false
        }
        expect(obj.res.data).to.be.a('array').and.that.lengthOf(0)

        return res ? Promise.resolve() : Promise.reject(COMMON_API)

      })

      it(`check file is exists and adjust the database success and the file is exists but the database is not the file info`, async function() {

        let res = true
        
        await new Promise((resolve, reject) => {
          if(!fs.existsSync(realFilePath)) {
            fs.writeFileSync(realFilePath, '')
          }
          const writeStream = fs.createWriteStream(realFilePath)
          const readStream = fs.createReadStream(mediaPath)

          readStream.pipe(writeStream)

          readStream.on('end', function(err) {
            if(err) return reject(err)
            resolve()
          })
        })
        .catch(err => {
          console.log('oops: ', err)
          res = false
        })

        const data = await Request
        .get(COMMON_API)
        .query({
          size,
          name: filename,
          chunksLength,
          suffix, 
          chunkSize, 
          filename: COMMON_API, 
          auth
        })
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(200)
        .expect('Content-Type', /json/)

        const { res: { text } } = data
        let obj
        try{
          obj = JSON.parse(text)
        }catch(_) {
          console.log(_)
          res = false
        }

        expect(obj.res.data).to.be.false

        return res ? Promise.resolve() : Promise.reject(COMMON_API)

      })

      it(`check file is exists and adjust the database success and the file is uploading and not complete`, async function() {

        let res = true

        const { model } = mockCreateVideo({
          name: COMMON_API,
          src: `/static${realFilePath.split('static')[1]}`,
          white_list: [userId],
          info: {
            md5: filename,
            complete: new Array(chunksLength - 1).fill(0).map((_, index) => index),
            status: "UPLOADING",
            chunk_size: chunksLength,
            size,
            mime: 'video/mp4'
          }
        })

        await VideoModel.findOne({
          "info.md5": filename
        })
        .select({
          _id: 1
        })
        .exec()
        .then(data => !!data)
        .then(data => {
          if(!data) return model.save()
          return false
        })
        .catch(err => {
          console.log('oops: ', err)
          res = false
        })

        const data = await Request
        .get(COMMON_API)
        .query({
          size,
          name: filename,
          chunksLength,
          suffix, 
          chunkSize, 
          filename: COMMON_API, 
          auth
        })
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(200)
        .expect('Content-Type', /json/)

        const { res: { text } } = data
        let obj
        try{
          obj = JSON.parse(text)
        }catch(_) {
          console.log(_)
          res = false
        }

        expect(obj.res.data).to.be.a('array').and.that.lengthOf(chunksLength - 1)

        return res ? Promise.resolve() : Promise.reject()

      })

    })

    describe(`check the file is exists and adjust the database fail test -> ${COMMON_API}`, function() {

      it(`check the file is exists and adjust the database fail because the params of suffix is not found`, function(done) {

        Request
        .get(COMMON_API)
        .query({
          size,
          name: filename,
          chunksLength,
          chunkSize, 
          filename: COMMON_API, 
          auth
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

      it(`check the file is exists and adjust the database fail because the params of suffix is not verify`, function(done) {

        Request
        .get(COMMON_API)
        .query({
          size,
          name: filename,
          chunksLength,
          suffix: `video/${COMMON_API}`, 
          chunkSize, 
          filename: COMMON_API, 
          auth
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

      it(`check the file is exists and adjust the database fail because the params of chunksLength is not found`, function(done) {

        Request
        .get(COMMON_API)
        .query({
          size,
          name: filename,
          suffix: `video/${COMMON_API}`, 
          chunkSize, 
          filename: COMMON_API, 
          auth
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

      it(`check the file is exists and adjust the database fail because the params of chunksLength is not verify`, function(done) {

        Request
        .get(COMMON_API)
        .query({
          size,
          name: filename,
          chunksLength: -1,
          suffix: `video/${COMMON_API}`, 
          chunkSize, 
          filename: COMMON_API, 
          auth
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

  describe(`post the file of chunk test -> ${COMMON_API}`, function() {

    describe(`post the file of chunk success test -> ${COMMON_API}`, function() {

      after(async function() {

        const res = await VideoModel.findOne({
          "info.md5": filename,
        })
        .select({
          _id: 0,
          "info.complete": 1
        })
        .exec()
        .then(data => {
          expect(data).to.be.a('object')
          const { _doc: { info: { complete } } } = data
          expect(complete).to.be.a('array').and.satisfies(function(target) {
            return target.some(com => com == 0)
          })
        })
        .then(_ => {
          expect(fs.statSync(path.resolve(templatePath, `${filename}-0`)).isFile()).to.be.true
          return true
        })
        .catch(err => {
          console.log('oops: ', err)
          return false
        })

        return res ? Promise.resolve() : Promise.reject(COMMON_API)
      })

      before(function(done) {
        const { model } = mockCreateVideo({
          name: COMMON_API,
          src: `/static${realFilePath.split('static')[1]}`,
          white_list: [userId],
          info: {
            md5: filename,
            complete: new Array(chunksLength - 1).fill(0).map((_, index) => index),
            status: "COMPLETE",
            chunk_size: chunksLength,
            size,
            mime: 'video/mp4'
          }
        })
        VideoModel.findOne({
          "info.md5": filename
        })
        .select({
          _id: 1
        })
        .exec()
        .then(data => !!data)
        .then(data => {
          if(!data) return model.save()
          return false
        })
        .then(function() {
          done()
        })
        .catch(err => {
          console.log('oops: ', err)
        })
      })

      beforeEach(function(done) {
        try {
          if(fs.existsSync(templatePath)) {
            const fileList = fs.readdirSync(templatePath)
            fileList.forEach(file => {
              const _path = path.resolve(templatePath, file)
              if(fs.existsSync(_path)) {
                fs.unlinkSync(_path)
              }
            })
            fs.rmdirSync(templatePath)
          }
          done()
        }catch(err) {
          console.log('oops: ', err)
          done(err)
        }
      })

      it(`post the file of chunk success with base64`, function(done) {

        Request
        .post(COMMON_API)
        .send({
          index: 0, 
          name: filename, 
          files: [{
            file: chunks[0].toString('base64')
          }]
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

      it(`post the file of chunk success with blob`, async function() {

        let res = true

        const filePath = path.resolve(__dirname, `${filename}-0`)

        try {
          fs.writeFileSync(filePath, chunks[0])
        }catch(err) {
          console.log('oops: ', err)
          res = false
        }

        await Request
        .post(COMMON_API)
        .field('index', 0)
        .field('name', filename)
        .attach('file', filePath)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(200)
        .expect('Content-Type', /json/)

        if(fs.existsSync(filePath)) {
          fs.unlinkSync(filePath)
        }

        return res ? Promise.resolve() : Promise.reject(COMMON_API)

      })

      it(`post the file of chunk success but the file is exists before`, async function() {

        let res = true

        const thisPath = path.resolve(__dirname, `${filename}-0`)

        try {
          fs.mkdirSync(templatePath)
          fs.writeFileSync(path.resolve(templatePath, `${filename}-0`), chunks[0])
          fs.writeFileSync(thisPath, chunks[0])
        }catch(err) {
          console.log('oops: ', err)
          res = false
        }

        await Request
        .post(COMMON_API)
        .field('index', 0)
        .field('name', filename)
        .attach('file', path.resolve(__dirname, `${filename}-0`))
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(200)
        .expect('Content-Type', /json/)

        if(fs.existsSync(thisPath)) {
          fs.unlinkSync(thisPath)
        }

        return res ? Promise.resolve() : Promise.reject(COMMON_API)

      })

    })

    describe(`post the file of chunk fail test -> ${COMMON_API}`, function() {

      it(`post the file of chunk fail because the params of index is not verify`, function(done) {

        Request
        .post(COMMON_API)
        .send({
          index: -1, 
          name: filename, 
          files: [
            {
              file: chunks[0].toString('base64')
            }
          ]
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

      it(`post the file of chunk fail because the params of index is not found`, function(done) {

        Request
        .post(COMMON_API)
        .send({
          name: filename, 
          files: [
            {
              file: chunks[0].toString('base64')
            }
          ]
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

      it(`post the file of chunk fail because the file is not belong to the user`, async function() {

        let res = true

        await VideoModel.updateOne({
          "info.md5": filename
        }, {
          white_list: [ ObjectId('53102b43bf1044ed8b0ba36b') ]
        })
        .catch(err => {
          res = false
          console.log('oops: ', err)
        })

        await Request
        .post(COMMON_API)
        .send({
          index: 0, 
          name: filename, 
          files: [
            {
              file: chunks[0].toString('base64')
            }
          ]
        })
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(403)
        .expect('Content-Type', /json/)

        await VideoModel.updateOne({
          "info.md5": filename
        }, {
          white_list: [ userId ]
        })
        .catch(err => {
          res = false
          console.log('oops: ', err)
        })

        return res ? Promise.resolve() : Promise.reject(COMMON_API)

      })

      it(`post the file of chunk fail because the database is not found this info`, async function() {

        let res = true

        await VideoModel.deleteMany({
          "info.md5": filename
        })
        .catch(err => {
          res = false
          console.log('oops: ', err)
        })

        await Request
        .post(COMMON_API)
        .send({
          index: 0, 
          name: filename, 
          files: [
            {
              file: chunks[0].toString('base64')
            }
          ]
        })
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(403)
        .expect('Content-Type', /json/)

        return res ? Promise.resolve() : Promise.reject(COMMON_API)

      })

    })

  })

  describe(`put the file complete upload test -> ${COMMON_API}`, function() {

    describe(`put the file complete upload success test -> ${COMMON_API}`, function() {

      before(async function() {

        chunks.forEach((chunk, index) => {
          fs.writeFileSync(path.resolve(templatePath, `${filename}-${index}`), chunk)
        })

        let res = true

        const { model } = mockCreateVideo({
          name: COMMON_API,
          src: `/static${realFilePath.split('static')[1]}`,
          white_list: [userId],
          info: {
            md5: filename,
            complete: new Array(chunksLength).fill(0).map((_, index) => index),
            status: "UPLOADING",
            chunk_size: chunksLength,
            size,
            mime: 'video/mp4'
          }
        })

        await VideoModel.findOneAndUpdate({
          "info.md5": filename
        }, {
          "info.status": "UPLOADING"
        })
        .select({
          _id: 1
        })
        .exec()
        .then(data => !!data)
        .then(data => {
          if(!data) return model.save()
          return false
        })
        .catch(err => {
          console.log('oops: ', err)
          res = false
        })

        return res ? Promise.resolve() : Promise.reject(COMMON_API)

      })

      after(function(done) {
        // const fileList = fs.readdirSync(templatePath)
        // fileList.forEach(file => {
        //   fs.unlinkSync(path.resolve(templatePath, file))
        // })
        expect(fs.existsSync(templatePath)).to.be.false

        VideoModel.findOne({
          "info.md5": filename,
          "info.status": "COMPLETE"
        })
        .select({
          _id: 1,
        })
        .exec()
        .then(data => {
          expect(data).to.be.a('object')
          done()
        })
        .catch(err => {
          console.log('oops: ', err)
        })
      })

      it(`put the file complete upload success`, function(done) {

        Request
        .put(COMMON_API)
        .send({
          name: filename, 
        })
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err) {
          if(err) return done(err)
          done(err)
        })

      })

    })

    describe(`put the file complete upload fail test -> ${COMMON_API}`, function() {

      before(function(done) {
        VideoModel.updateOne({
          "info.md5": filename
        }, {
          "info.status": "UPLOADING" 
        })
        .then(function() {
          done()
        })
        .catch(err => {
          console.log('oops: ', err)
        })
      })

      it(`put the file complete upload fail because the chunk length is not truely`, async function() {

        let res = true

        try {
          const _path = path.resolve(templatePath, `${filename}-0`)
          if(fs.existsSync(_path)) {
            fs.unlinkSync(_path)
          }
        }catch(err) {
          console.log('oops: ', err)
          res = false
        }

        await Request
        .put(COMMON_API)
        .send({
          name: filename, 
        })
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(500)
        .expect('Content-Type', /json/)

        // try {
        //   fs.writeFileSync(path.resolve(templatePath, `${filename}-0`), chunks[0])
        // }catch(err) {
        //   console.log('oops: ', err)
        //   res = false
        // }

        return res ? Promise.resolve() : Promise.reject(COMMON_API)

      })

      it(`put the file complete upload fail because the file is not belong to this user`, async function() {
        
        let res = true

        await VideoModel.updateOne({
          "info.md5": filename
        }, {
          white_list: [ ObjectId('53102b43bf1044ed8b0ba36b') ]
        })
        .catch(err => {
          res = false
          console.log('oops: ', err)
        })

        await Request
        .put(COMMON_API)
        .send({
          name: filename, 
        })
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(404)
        .expect('Content-Type', /json/)

        await VideoModel.updateOne({
          "info.md5": filename
        }, {
          white_list: [ userId ]
        })
        .catch(err => {
          res = false
          console.log('oops: ', err)
        })

        return res ? Promise.resolve() : Promise.reject(COMMON_API)

      })

      it(`put the file complete upload fail because the database is not found the file info`, async function() {
        
        let res = true

        await VideoModel.deleteMany({
          "info.md5": filename
        })
        .catch(err => {
          console.log('oops: ', err)
          res = false
        })

        await Request
        .put(COMMON_API)
        .send({
          name: filename, 
        })
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(404)
        .expect('Content-Type', /json/)

        return res ? Promise.resolve() : Promise.reject(COMMON_API)

      })

    })

  })

})