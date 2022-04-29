require('module-alias/register')
const { expect } = require('chai')
const { Types: { ObjectId } } = require('mongoose')
const { ImageModel, UserModel, ScreenModal } = require('@src/utils')
const { mockCreateImage, mockCreateUser, mockCreateScreen } = require('@test/utils')
const { scheduleMethod } = require("@src/utils/schedule/unuse-media/index.schedule")

const COMMON_API = '/index.schedule/index.schedule.png'
const SCHEDULE_PREFIX = "schedule of unuse media clear test"

describe(SCHEDULE_PREFIX, function() {

  let userId 
  let imageId 
  let screenId 

  before(function(done) {

    const { model:image } = mockCreateImage({
      src: COMMON_API
    })

    const { model: user } = mockCreateUser({
      username: COMMON_API
    })

    const { model: screen } = mockCreateScreen({
      name: COMMON_API
    })

    Promise.all([
      image.save(),
      user.save(),
      screen.save() 
    ])
    .then(([image, user, screen]) => {
      imageId = image._id 
      userId = user._id
      screenId = screen._id 
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
      ImageModel.deleteMany({
        src: COMMON_API
      }),
      UserModel.deleteMany({
        username: COMMON_API
      }),
      ScreenModal.deleteMany({
        name: COMMON_API
      }),
    ])
    .then(_ => {
      done()
    })
    .catch(err => {
      done(err)
    })
  })

  it(`delete image because not use`, function(done) {
    scheduleMethod({
      test: true 
    })
    .then(_ => {
      return ImageModel.findOne({
        src: COMMON_API 
      })
      .exec() 
      .then(data => {
        expect(!!data).to.be.false 
      })
    })
    .then(_ => {
      done()
    })
    .catch(err => {
      done(err)
    })
  })

  it('can not delete because use image in user', function(done) {
    let imageId 
    const { model } = mockCreateImage({
      src: COMMON_API,
    }) 
    model.save()
    .then(data => {
      imageId = data._id 
      return UserModel.updateMany({
        username: COMMON_API 
      }, {
        $set: {
          avatar: imageId 
        }
      })
    })
    .then(_ => {
      return scheduleMethod({
        test: true 
      })
    })
    .then(_ => {
      return ImageModel.findOne({
        src: COMMON_API
      })
      .exec() 
    })
    .then(data => {
      expect(!!data).to.be.true 
    })
    .then(_ => {
      return ImageModel.deleteOne({
        _id: imageId
      })
    })
    .then(_ => {
      return UserModel.updateMany({
        username: COMMON_API
      }, {
        $set: {
          avatar: ObjectId('8f63270f005f1c1a0d9448ca')
        }
      })
    })
    .then(_ => {
      done()
    })
    .catch(err => {
      done(err)
    })
  })

  it('can not delete because use image in screen poster', function(done) {
    let imageId 
    const { model } = mockCreateImage({
      src: COMMON_API,
    }) 
    model.save()
    .then(data => {
      imageId = data._id 
      return ScreenModal.updateMany({
        name: COMMON_API 
      }, {
        $set: {
          poster: COMMON_API 
        }
      })
    })
    .then(_ => {
      return scheduleMethod({
        test: true 
      })
    })
    .then(_ => {
      return ImageModel.findOne({
        src: COMMON_API
      })
      .exec() 
    })
    .then(data => {
      expect(!!data).to.be.true 
    })
    .then(_ => {
      return ImageModel.deleteOne({
        _id: imageId
      })
    })
    .then(_ => {
      return ScreenModal.updateMany({
        name: COMMON_API
      }, {
        $set: {
          poster: '22222'
        }
      })
    })
    .then(_ => {
      done()
    })
    .catch(err => {
      done(err)
    })
  })

  it('can not delete because use image in screen data', function(done) {
    let imageId 
    const { model } = mockCreateImage({
      src: COMMON_API,
    }) 
    model.save()
    .then(data => {
      imageId = data._id 
      return ScreenModal.updateMany({
        name: COMMON_API 
      }, {
        $set: {
          data: JSON.stringify({
            poster: COMMON_API 
          }) 
        }
      })
    })
    .then(_ => {
      return scheduleMethod({
        test: true 
      })
    })
    .then(_ => {
      return ImageModel.findOne({
        src: COMMON_API
      })
      .exec() 
    })
    .then(data => {
      expect(!!data).to.be.true 
    })
    .then(_ => {
      return ImageModel.deleteOne({
        _id: imageId
      })
    })
    .then(_ => {
      return ScreenModal.updateMany({
        name: COMMON_API
      }, {
        $set: {
          data: JSON.stringify({})
        }
      })
    })
    .then(_ => {
      done()
    })
    .catch(err => {
      done(err)
    })
  })

})