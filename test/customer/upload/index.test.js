require('module-alias/register')
const { expect } = require('chai')
const { mockCreateUser, Request, mockCreateVideo, generateTemplateFile } = require('@test/utils')
const { VideoModel, UserModel, fileEncoded, STATIC_FILE_PATH } = require('@src/utils')
const fs = require('fs')
const root = require('app-root-path')
const path = require('path')

const strToBase = (str) => {
  return Buffer.from(str).toString('base64')
}

const COMMON_API = '/api/customer/upload'

describe(`${COMMON_API} test`, function() {

  let userId
  let selfToken
  let signToken
  let mediaPath;
  let file;
  let filename;
  let size;
  let originName;
  let templatePath;
  let realFilePath;
  const chunkSize = 1024 * 1024 * 1;
  let chunksLength;
  let slice = Uint8Array.prototype.slice;
  let chunks;
  const suffix = 'video/mp4'
  const auth = 'PUBLIC'

  before(async function() {

    let err = false 

    await generateTemplateFile()

    mediaPath = path.resolve(root.path, 'test/assets/test-video.mp4')
    file = fs.readFileSync(mediaPath)
    filename = fileEncoded(file)
    size = fs.statSync(mediaPath).size
    originName = 'test-video.mp4'
    templatePath = path.resolve(STATIC_FILE_PATH, 'template', filename)
    realFilePath = path.resolve(STATIC_FILE_PATH, 'video', `${filename}.mp4`)
    chunksLength = Math.ceil(size / chunkSize)
    chunks = new Array(chunksLength).fill(0).map((_, index) => {
      if(index + 1 === chunksLength) return slice.call(file, index * chunkSize )
      return slice.call(file, index * chunkSize, (index + 1) * chunkSize)
    })

    const { model, signToken: getToken } = mockCreateUser({
      username: COMMON_API
    })

    signToken = getToken

    await model.save()
    .then(data => {
      userId = data._id
      selfToken = signToken(userId)
    })
    .catch(err => {
      console.log('oops: ', err)
    })

    return err ? Promise.reject() : Promise.resolve()

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
      }catch(err) {}
    })
    .then(_ => {
      const files = fs.readdirSync(__dirname)
      files.forEach(item => {
        const name = path.extname(item)
        if(!name) fs.unlinkSync(path.join(__dirname, item))
      })
      return true 
    })
    .catch(err => {
      console.log('oops: ', err)
      return false
    })

    return res ? Promise.resolve() : Promise.reject(COMMON_API)

  })

  beforeEach(function(done) {
    selfToken = signToken(userId)
    done()
  })

  describe(`pre check the params -> ${COMMON_API}`, function() {

    describe(`pre check the params fail test -> ${COMMON_API}`, function() {

      it(`pre check params fail because the params of size is too large`, function(done) {

        Request
        .patch(COMMON_API)
        .attach('file', mediaPath)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`,
          "Upload-Metadata": `md5 ${strToBase(filename)},offset ${strToBase('0')}`
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
        let videoId

        const { model } = mockCreateVideo({
          name: COMMON_API,
          src: `/static${realFilePath.split('static')[1]}`,
          white_list: [ userId ],
          info: {
            md5: filename,
            complete: new Array(chunksLength).fill(0).map((_, index) => index),
            status: "COMPLETE",
            chunk_size: chunkSize,
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
            videoId = data._doc._id
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
        .then(([video]) => {
          videoId = video._id
        })
        .catch(err => {
          console.log('oops: ', err)
          res = false
        })

        await Request
        .head(COMMON_API)
        .set({
          Authorization: `Basic ${selfToken}`,
          'Upload-Metadata': `md5 ${strToBase(filename)},auth ${strToBase(auth)},size ${strToBase(size.toString())},mime ${strToBase(suffix)},name ${strToBase(originName)},chunk ${strToBase(chunkSize.toString())}`,
          "Tus-Resumable": '1.0.0'
        })
        .expect(200)
        .expect('Tus-Resumable', '1.0.0')
        .expect('Location', '/api/customer/upload')
        .expect('Upload-Offset', size.toString())
        .expect('Upload-Length', size.toString())
        .expect('Upload-Id', videoId.toString())

        // //检查
        // const { res: { text } } = data
        // let obj
        // try{
        //   obj = JSON.parse(text)
        // }catch(_) {
        //   console.log(_)
        //   res = false
        // }

        // expect(obj.res.data).to.be.false

        return res ? Promise.resolve() : Promise.reject()

      })

      it(`check file is exists and adjust the database success and the file is not exists and the database is not exists`, async function() {

        let res = true

        await Promise.all([
          VideoModel.deleteMany({
            "info.md5": filename
          }),
          new Promise((resolve, reject) => {
            if(fs.existsSync(realFilePath)) {
              fs.unlinkSync(realFilePath)
            }
            resolve()
          })
        ])
        .catch(err => {
          console.log('oops: ', err)
          res = false
        })

        await Request
        .head(COMMON_API)
        .set({
          Authorization: `Basic ${selfToken}`,
          'Upload-Metadata': `md5 ${strToBase(filename)},auth ${strToBase(auth)},size ${strToBase(size.toString())},mime ${strToBase(suffix)},name ${strToBase(originName)},chunk ${strToBase(chunkSize.toString())}`,
          "Tus-Resumable": '1.0.0'
        })
        .expect(200)
        .expect('Tus-Resumable', '1.0.0')
        .expect('Location', '/api/customer/upload')
        .expect('Upload-Offset', '0')
        .expect('Upload-Length', size.toString())

        return res ? Promise.resolve() : Promise.reject(COMMON_API)

      })

      it(`check file is exists and adjust the database success and the file is uploading and not complete`, async function() {

        let res = true
        let videoId

        const { model } = mockCreateVideo({
          name: COMMON_API,
          src: `/static${realFilePath.split('static')[1]}`,
          white_list: [userId],
          info: {
            md5: filename,
            complete: new Array(chunksLength - 1).fill(0).map((_, index) => index),
            status: "UPLOADING",
            chunk_size: chunkSize,
            size,
            mime: 'video/mp4'
          }
        })

        await VideoModel.deleteMany({
          "info.md5": filename
        })
        .then(_ => {
          return model.save()
        })
        .then(data => {
          videoId = data._id
        })
        .catch(err => {
          console.log('oops: ', err)
          res = false
        })

        await Request
        .head(COMMON_API)
        .set({
          Authorization: `Basic ${selfToken}`,
          'Upload-Metadata': `md5 ${strToBase(filename)},auth ${strToBase(auth)},size ${strToBase(size.toString())},mime ${strToBase(suffix)},name ${strToBase(originName)},chunk ${strToBase(chunkSize.toString())}`,
          "Tus-Resumable": '1.0.0'
        })
        .expect(200)
        .expect('Tus-Resumable', '1.0.0')
        .expect('Location', '/api/customer/upload')
        .expect('Upload-Offset', (chunkSize * (chunksLength - 1)).toString())
        .expect('Upload-Length', size.toString())
        .expect('Upload-Id', videoId.toString())

        return res ? Promise.resolve() : Promise.reject(COMMON_API)

      })

    })

    describe(`check the file is exists and adjust the database fail test -> ${COMMON_API}`, function() {

      it(`check the file is exists and adjust the database fail because the params of suffix is not found`, function(done) {

        Request
        .head(COMMON_API)
        .set({
          Authorization: `Basic ${selfToken}`,
          'Upload-Metadata': `md5 ${strToBase(filename)},auth ${strToBase(auth)},size ${strToBase(size.toString())},name ${strToBase(originName)},chunk ${strToBase(chunkSize.toString())}`,
          "Tus-Resumable": '1.0.0'
        })
        .expect(404)
        .end(function(err) {
          if(err) return done(err)
          done()
        })

      })

      it(`check the file is exists and adjust the database fail because the params of suffix is not verify`, function(done) {

        Request
        .head(COMMON_API)
        .set({
          Authorization: `Basic ${selfToken}`,
          'Upload-Metadata': `md5 ${strToBase(filename)},auth ${strToBase(auth)},size ${strToBase(size.toString())},mime ${strToBase(`${suffix}/1111`)},name ${strToBase(originName)},chunk ${strToBase(chunkSize.toString())}`,
          "Tus-Resumable": '1.0.0'
        })
        .expect(404)
        .end(function(err) {
          if(err) return done(err)
          done()
        })

      })

      it(`check the file is exists and adjust the database fail because the params of size is not found`, function(done) {

        Request
        .head(COMMON_API)
        .set({
          Authorization: `Basic ${selfToken}`,
          'Upload-Metadata': `md5 ${strToBase(filename)},auth ${strToBase(auth)},mime ${strToBase(suffix)},name ${strToBase(originName)},chunk ${strToBase(chunkSize.toString())}`,
          "Tus-Resumable": '1.0.0'
        })
        .expect(404)
        .end(function(err) {
          if(err) return done(err)
          done()
        })

      })

      it(`check the file is exists and adjust the database fail because the params of size is not verify`, function(done) {

        Request
        .head(COMMON_API)
        .set({
          Authorization: `Basic ${selfToken}`,
          'Upload-Metadata': `md5 ${strToBase(filename)},auth ${strToBase(auth)},size ${strToBase('-1')},mime ${strToBase(suffix)},name ${strToBase(originName)},chunk ${strToBase(chunkSize.toString())}`,
          "Tus-Resumable": '1.0.0'
        })
        .expect(404)
        .end(function(err) {
          if(err) return done(err)
          done()
        })

      })

      it(`check the file is exists and adjust the database fail because the params of md5 is not found`, function(done) {

        Request
        .head(COMMON_API)
        .set({
          Authorization: `Basic ${selfToken}`,
          'Upload-Metadata': `auth ${strToBase(auth)},size ${strToBase(size.toString())},mime ${strToBase(suffix)},name ${strToBase(originName)},chunk ${strToBase(chunkSize.toString())}`,
          "Tus-Resumable": '1.0.0'
        })
        .expect(404)
        .end(function(err) {
          if(err) return done(err)
          done()
        })

      })

      it(`check the file is exists and adjust the database fail because the params of md5 is not verify`, function(done) {

        Request
        .head(COMMON_API)
        .set({
          Authorization: `Basic ${selfToken}`,
          'Upload-Metadata': `md5 ${strToBase(filename)},size ${strToBase(size.toString())},mime ${strToBase(suffix)},name ${strToBase(originName)},chunk ${strToBase(chunkSize.toString())}`,
          "Tus-Resumable": '1.0.0'
        })
        .expect(404)
        .end(function(err) {
          if(err) return done(err)
          done()
        })

      })

      it(`check the file is exists and adjust the database fail because the params of auth is not verify`, function(done) {

        Request
        .head(COMMON_API)
        .set({
          Authorization: `Basic ${selfToken}`,
          'Upload-Metadata': `md5 ${strToBase(filename)},auth ${strToBase('1111')},size ${strToBase(size.toString())},mime ${strToBase(suffix)},name ${strToBase(originName)},chunk ${strToBase(chunkSize.toString())}`,
          "Tus-Resumable": '1.0.0'
        })
        .expect(404)
        .end(function(err) {
          if(err) return done(err)
          done()
        })

      })

      it(`check the file is exists and adjust the database fail because the params of chunk is not found`, function(done) {

        Request
        .head(COMMON_API)
        .set({
          Authorization: `Basic ${selfToken}`,
          'Upload-Metadata': `md5 ${strToBase(filename)},auth ${strToBase(auth)},size ${strToBase(size.toString())},mime ${strToBase(suffix)},name ${strToBase(originName)}`,
          "Tus-Resumable": '1.0.0'
        })
        .expect(404)
        .end(function(err) {
          if(err) return done(err)
          done()
        })

      })

      it(`check the file is exists and adjust the database fail because the params of md5 is not verify`, function(done) {

        Request
        .head(COMMON_API)
        .set({
          Authorization: `Basic ${selfToken}`,
          'Upload-Metadata': `md5 ${strToBase(filename)},auth ${strToBase(auth)},size ${strToBase(size.toString())},mime ${strToBase(suffix)},name ${strToBase(originName)},chunk ${strToBase('-1')}`,
          "Tus-Resumable": '1.0.0'
        })
        .expect(404)
        .end(function(err) {
          if(err) return done(err)
          done()
        })

      })

    })

  })

  describe(`patch the file of chunk test -> ${COMMON_API}`, function() {

    describe(`patch the file of chunk success test -> ${COMMON_API}`, function() {

      const createVideo = async (complete) => {
        const { model } = mockCreateVideo({
          name: COMMON_API,
          src: `/static${realFilePath.split('static')[1]}`,
          white_list: [userId],
          info: {
            md5: filename,
            complete,
            status: "UPLOADING",
            chunk_size: chunkSize,
            size,
            mime: 'video/mp4'
          }
        })

        await VideoModel.deleteMany({
          "info.md5": filename
        })
        .then(_ => {
          return model.save()
        })
        .catch(err => {
          console.log('oops: ', err)
        })
      }

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

      it(`patch the file of chunk success and upload complete`, async function() {

        let res = true

        await createVideo(new Array(chunksLength - 1).fill(0).map((_, index) => index))

        const uploadFileChunk = path.resolve(__dirname, `${filename}-${chunksLength - 1}`)

        const templateFolder = path.resolve(STATIC_FILE_PATH, 'template', filename)

        if(!fs.existsSync(templateFolder)) fs.mkdirSync(templateFolder)
        if(!fs.existsSync(uploadFileChunk)) fs.writeFileSync(uploadFileChunk, chunks[chunksLength - 1])

        for(let i = 0; i < chunksLength - 1; i ++) {
          const filePath = path.resolve(templateFolder, `${filename}-${i}`)
          try {
            fs.writeFileSync(filePath, chunks[i])
          }catch(err) {
            console.log('oops: ', err)
          }
        }

        await Request
        .patch(COMMON_API)
        .attach('file', uploadFileChunk)
        .set({
          Authorization: `Basic ${selfToken}`,
          'Upload-Metadata': `md5 ${strToBase(filename)}`,
          "Tus-Resumable": '1.0.0',
          'Upload-Offset': (chunksLength - 1) * chunkSize
        })
        .expect(204)
        .expect('Upload-Offset', size.toString())
        .then(_ => {})

        if(fs.existsSync(uploadFileChunk)) {
          fs.unlinkSync(uploadFileChunk)
        }

        expect(fs.existsSync(path.join(STATIC_FILE_PATH, 'video', `${filename}.mp4`))).to.be.true
        expect(fs.statSync(path.join(STATIC_FILE_PATH, 'video', `${filename}.mp4`)).size).to.be.equal(size)

        return res ? Promise.resolve() : Promise.reject(COMMON_API)

      })

      it(`patch the file of chunk success and return the the min of uncomplete chunk`, async function() {

        let res = true

        await createVideo(new Array(chunksLength - 2).fill(0).map((_, index) => index + 1))

        const uploadFileChunk = path.resolve(__dirname, `${filename}-${chunksLength - 1}`)

        const templateFolder = path.resolve(STATIC_FILE_PATH, 'template', filename)

        if(!fs.existsSync(templateFolder)) fs.mkdirSync(templateFolder)
        if(!fs.existsSync(uploadFileChunk)) fs.writeFileSync(uploadFileChunk, chunks[chunksLength - 1])

        for(let i = 1; i < chunksLength - 1; i ++) {
          const filePath = path.resolve(templateFolder, `${filename}-${i}`)
          try {
            fs.writeFileSync(filePath, chunks[i])
          }catch(err) {
            console.log('oops: ', err)
          }
        }

        await Request
        .patch(COMMON_API)
        .attach('file', uploadFileChunk)
        .set({
          Authorization: `Basic ${selfToken}`,
          'Upload-Metadata': `md5 ${strToBase(filename)}`,
          "Tus-Resumable": '1.0.0',
          'Upload-Offset': (chunksLength - 1) * chunkSize
        })
        .expect(204)
        .expect('Upload-Offset', '0')

        if(fs.existsSync(uploadFileChunk)) {
          fs.unlinkSync(uploadFileChunk)
        }

        return res ? Promise.resolve() : Promise.reject(COMMON_API)

      })

    })

    describe(`patch the file of chunk fail test -> ${COMMON_API}`, function() {

      const uploadFileChunk = path.resolve(__dirname, `${filename}-${chunksLength - 1}`)

      beforeEach((done) => {

        try {
          fs.writeFileSync(uploadFileChunk, chunks[chunksLength - 1])
        }catch(err) {}

        done()

      })

      after(function(done) {
        try {
          fs.unlinkSync(uploadFileChunk)
        }catch(err) {}
        done()
      })

      it(`patch the file of chunk fail because the params of offset is not verify`, function(done) {

        Request
        .patch(COMMON_API)
        .attach('file', uploadFileChunk)
        .set({
          Authorization: `Basic ${selfToken}`,
          'Upload-Metadata': `md5 ${strToBase(filename)}`,
          "Tus-Resumable": '1.0.0',
          'Upload-Offset': '-1'
        })
        .expect(400)
        .end(function(err) {
          if(err) return done(err)
          done()
        })

      })

      it(`patch the file of chunk fail because the params of offset is not found`, function(done) {

        Request
        .patch(COMMON_API)
        .attach('file', uploadFileChunk)
        .set({
          Authorization: `Basic ${selfToken}`,
          'Upload-Metadata': `md5 ${strToBase(filename)}`,
          "Tus-Resumable": '1.0.0',
        })
        .expect(400)
        .end(function(err) {
          if(err) return done(err)
          done()
        })

      })

      it(`patch the file of chunk fail because the params of md5 is not verify`, function(done) {

        Request
        .patch(COMMON_API)
        .attach('file', uploadFileChunk)
        .set({
          Authorization: `Basic ${selfToken}`,
          'Upload-Metadata': `md5 ${strToBase(filename + '22')}`,
          "Tus-Resumable": '1.0.0',
          'Upload-Offset': 0,
        })
        .expect(400)
        .end(function(err) {
          if(err) return done(err)
          done()
        })

      })

      it(`patch the file of chunk fail because the params of md5 is not found`, function(done) {

        Request
        .patch(COMMON_API)
        .attach('file', uploadFileChunk)
        .set({
          Authorization: `Basic ${selfToken}`,
          "Tus-Resumable": '1.0.0',
          'Upload-Offset': 0
        })
        .expect(400)
        .end(function(err) {
          if(err) return done(err)
          done()
        })

      })

      it(`patch the file of chunk fail because the database is not found this info`, async function() {

        let res = true

        await VideoModel.deleteMany({
          "info.md5": filename
        })
        .catch(err => {
          console.log(err)
          res = false
        })

        await Request
        .patch(COMMON_API)
        .attach('file', uploadFileChunk)
        .set({
          Authorization: `Basic ${selfToken}`,
          'Upload-Metadata': `md5 ${strToBase(filename)}`,
          "Tus-Resumable": '1.0.0',
          'Upload-Offset': 0
        })
        .expect(500)
        
        return res ? Promise.resolve() : Promise.reject(COMMON_API)

      })

    })

  })

  describe(`create the file upload task test -> ${COMMON_API}`, function() {

    describe(`create the file upload task success test -> ${COMMON_API}`, function() {

      before(function(done) {

        VideoModel.deleteMany({
          "info.md5": filename
        })
        .then(_ => {
          done()
        })
        .catch(err => {
          console.log('oops: ', err)
        })

      })

      it(`create the file upload task success`, function(done) {

        Request
        .post(COMMON_API)
        .set({
          Authorization: `Basic ${selfToken}`,
          'Upload-Metadata': `md5 ${strToBase(filename)},auth ${strToBase(auth)},size ${strToBase(size.toString())},mime ${strToBase(suffix)},name ${strToBase(originName)},chunk ${strToBase(chunkSize.toString())}`,
          "Tus-Resumable": '1.0.0'
        })
        .expect(201)
        .expect('Tus-Resumable', '1.0.0')
        .expect('Location', '/api/customer/upload')
        .expect('Upload-Length', size.toString())
        .end(function(err) {
          if(err) return done(err)
          done()
        })

      })

    })

  })

  describe(`get the uploaded file info -> ${COMMON_API}`, () => {

    let videoId

    before(function(done) {

      const { model } = mockCreateVideo({
        name: COMMON_API,
        src: `/static${realFilePath.split('static')[1]}`,
        white_list: [ userId ],
        info: {
          md5: filename,
          complete: new Array(chunksLength).fill(0).map((_, index) => index),
          status: "COMPLETE",
          chunk_size: chunkSize,
          size,
          mime: 'video/mp4'
        }
      })

      model.save()
      .then(data => {
        videoId = data._id
        done()
      })
      .catch(err => {
        console.log('oops' + err)
      })

    })
    
    describe(`get the uploaded file info scueess test -> ${COMMON_API}`, function() {

      it(`get the uploaded file info success`, function(done) {

        Request
        .get(`${COMMON_API}?load=${videoId.toString()}`)
        .set({
          Authorization: `Basic ${selfToken}`,
          "Tus-Resumable": '1.0.0'
        })
        .expect(200)
        .end(function(err) {
          if(err) return done(err)
          done()
        })

      })

    })

    describe(`get the uploaded file info fail test -> ${COMMON_API}`, function() {

      it(`get the uploaded file info fail because the videoId is not found`, function(done) {

        Request
        .get(`${COMMON_API}`)
        .set({
          Authorization: `Basic ${selfToken}`,
          "Tus-Resumable": '1.0.0'
        })
        .expect(400)
        .end(function(err) {
          if(err) return done(err)
          done()
        })

      })

      it(`get the uploaded file info fail because the videoId is not verify`, function(done) {

        Request
        .get(`${COMMON_API}?load=${videoId.toString()}1`)
        .set({
          Authorization: `Basic ${selfToken}`,
          "Tus-Resumable": '1.0.0'
        })
        .expect(400)
        .end(function(err) {
          if(err) return done(err)
          done()
        })

      })

    })

  })
  

})