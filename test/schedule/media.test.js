require('module-alias/register')
const { expect } = require('chai')
const fse = require('fs-extra')
const path = require('path')
const Day = require('dayjs')
const root = require('app-root-path')
const { VideoModel, STATIC_FILE_PATH, MEDIA_STATUS } = require('@src/utils')
const { mockCreateVideo } = require('@test/utils')
const { scheduleMethod, MAX_KEEP_FILE_MILL } = require("@src/utils/schedule/media.schedule")

const SCHEDULE_PREFIX = "schedule of media clear test"

const testOriginPath = path.join(root.path, 'test/assets/test-video.mp4')
const mediaPath = path.join(STATIC_FILE_PATH, '/video/test-video.mp4')

async function createTempFile() {
  const exists = fse.existsSync(mediaPath)
  if(exists) return 
  await fse.copyFile(testOriginPath, mediaPath)
}

describe(SCHEDULE_PREFIX, function() {

  beforeEach(function(done) {

    createTempFile()
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
        src: mediaPath
      }),
    ])
    .then(_ => {
      done()
    })
    .catch(err => {
      done(err)
    })
  })

  it(`media in database not exists`, function(done) {
    scheduleMethod({
      test: true 
    })
    .then(_ => {
      const exists = fse.existsSync(mediaPath)
      expect(exists).to.be.false 
    })
    .then(_ => {
      done()
    })
    .catch(err => {
      done(err)
    })
  })

  it('media in database status is error', function(done) {
    const { model } = mockCreateVideo({
      src: mediaPath,
      info: {
        status: MEDIA_STATUS.ERROR
      }
    }) 
    model.save()
    .then(_ => {
      return scheduleMethod({
        test: true 
      })
    })
    .then(_ => {
      const exists = fse.existsSync(mediaPath)
      expect(exists).to.be.false 
      return VideoModel.findOne({
        src: mediaPath
      })
      .select({
        _id: 1
      })
      .exec()
    })
    .then(data => {
      expect(!!data).to.be.false 
    })
    .then(_ => {
      done()
    })
    .catch(err => {
      done(err)
    })
  })

  it('media in database status is uploading and last upload is one month ago', function(done) {
    console.log(Day(Date.now() - MAX_KEEP_FILE_MILL - 100).toDate(), 2333)
    const { model } = mockCreateVideo({
      src: mediaPath,
      updatedAt: Day(Date.now() - MAX_KEEP_FILE_MILL - 100).toDate(),
      info: {
        status: MEDIA_STATUS.UPLOADING
      }
    }) 
    model.save()
    .then(_ => {
      return scheduleMethod({
        test: true 
      })
    })
    .then(_ => {
      const exists = fse.existsSync(mediaPath)
      expect(exists).to.be.false 
      return VideoModel.findOne({
        src: mediaPath
      })
      .select({
        _id: 1
      })
      .exec()
    })
    .then(data => {
      expect(!!data).to.be.false 
    })
    .then(_ => {
      done()
    })
    .catch(err => {
      done(err)
    })
  })

})