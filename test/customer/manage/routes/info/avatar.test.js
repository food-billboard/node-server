require('module-alias/register')
const { mockCreateUser, mockCreateImage, Request, commonValidate } = require('@test/utils')
const { UserModel, ImageModel } = require('@src/utils')
const mongoose = require('mongoose')
const { Types: { ObjectId } } = mongoose

const COMMON_API = '/api/customer/manage/info/avatar'

describe(`${COMMON_API} test`, function() {

  let selfToken
  let imageId
  let result

  before(async function() {

    const { model: image } = mockCreateImage({
      src: COMMON_API
    })
    const { model: user, token } = mockCreateUser({
      username: COMMON_API,
      avatar: ObjectId('53102b43bf1044ed8b0ba36b')
    })

    selfToken = token

    await Promise.all([
      image.save(),
      user.save()
    ])
    .then(([image, user]) => {
      result = user
      imageId = image._id
    })
    .catch(err => {
      console.log('oops: ', err)
    })

    return Promise.resolve()

  })

  after(async function() {

    await Promise.all([
      ImageModel.deleteMany({
        src: COMMON_API
      }),
      UserModel.deleteMany({
        username: COMMON_API
      })
    ])
    .catch(err => {
      console.log('oops: ', err)
    })

    return Promise.resolve()

  })

  describe(`put the new avatar test -> ${COMMON_API}`, function() {

    describe(`put the new avatar success test -> ${COMMON_API}`, function() {

      after(function(done) {

        UserModel.findOne({
          avatar: imageId
        })
        .select({
          _id: 1
        })
        .exec()
        .then(data => !!data && data._id)
        .then(data => {
          commonValidate.objectId(data)
          done()
        })
        .catch(err => {
          console.log('oops: ', err)
        })

      })

      it(`put the new avatar success`, function(done) {

        Request
        .put(COMMON_API)
        .send({
          _id: imageId.toString()
        })
        .set({
          Accept: 'Application/json',
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

    describe(`put the new avatar fail test -> ${COMMON_API}`, function() {

      describe(`put the new avatar fail because the image id has something wrong -> ${COMMON_API}`, function() {

        it(`put the new avatar fail because the image is not found`, function(done) {

          const id = imageId.toString()

          Request
          .put(COMMON_API)
          .send({
            _id: `${(parseInt(id.slice(0, 1)) + 5) % 10}${id.slice(1)}`
          })
          .set({
            Accept: 'Application/json',
            Authorization: `Basic ${selfToken}`
          })
          .expect(404)
          .expect('Content-Type', /json/)
          .end(function(err) {
            if(err) return done(err)
            done()
          })

        })

        it(`put the new avatar fail because the image id is not verify`, function(done) {

          Request
          .put(COMMON_API)
          .send({
            _id: imageId.toString().slice(1)
          })
          .set({
            Accept: 'Application/json',
            Authorization: `Basic ${selfToken}`
          })
          .expect(400)
          .expect('Content-Type', /json/)
          .end(function(err) {
            if(err) return done(err)
            done()
          })

        })

        it(`put the new avatar fail because lack the image id`, function(done) {

          Request
          .put(COMMON_API)
          .set({
            Accept: 'Application/json',
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

      // describe(`put the new avatar fail because the image is not allow use or unauth test -> ${COMMON_API}`, function() {

      //   before(function(done) {

      //     imageDatabase.updateOne({
      //       src: COMMON_API
      //     }, {
      //       auth: 'PRIVATE'
      //     })
      //     .then(function() {
      //       done()
      //     })
      //     .catch(err => {
      //       console.log('oops: ', err)
      //     })

      //   })

      //   it(`put the new avatar fail because the image is not allow use or unauth`, function(done) {



      //   })

      // })

    })

  })

}) 