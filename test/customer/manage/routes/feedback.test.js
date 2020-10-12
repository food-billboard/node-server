require('module-alias/register')
const { expect } = require('chai')
const { mockCreateUser, mockCreateFeedback, mockCreateImage, Request } = require('@test/utils')
const { UserModel, FeedbackModel, ImageModel } = require('@src/utils')
const mongoose = require('mongoose')
const { Types: { ObjectId } } = mongoose

const COMMON_API = '/api/customer/manage/feedback'

function responseExpect(res, validate=[]) {

  const { res: { data: target } } = res

  expect(target).to.be.true

  if(Array.isArray(validate)) {
    validate.forEach(valid => {
      typeof valid == 'function' && valid(target)
    })
  }else if(typeof validate == 'function') {
    validate(target)
  }
}

describe(`${COMMON_API} test`, function() {

  let imageId
  let userId
  let selfToken
  let result

  before(async function() {

    const { model, token } = mockCreateUser({
      username: COMMON_API
    })
    const { model: image } = mockCreateImage({
      src: COMMON_API
    })

    selfToken = token

    await Promise.all([
      model.save(),
      image.save()
    ])
    .then(([data, image]) => {
      userId = data._id
      imageId = image._id
      result = data
    })
    .catch(err => {
      console.log('oops: ', err)
    })

    return Promise.resolve()

  })

  after(async function() {

    await Promise.all([
      UserModel.deleteMany({
        username: COMMON_API
      }),
      FeedbackModel.deleteMany({
        "content.video": [],
      }),
      ImageModel.deleteMany({
        src: COMMON_API
      })
    ])
    .catch(err => {
      console.log('oops: ', err)
    })

    return Promise.resolve()

  })

  // describe(`pre check the user is feedback frequently -> ${COMMON_API}`, function() {

  //   describe(`pre check the user is feedback frequently success test -> ${COMMON_API}`, function() {

  //     it(`pre check the user is feedback frequently success and return yes`, function() {

  //     })

  //     it(`pre check the user is feedback frequently success and return false`, function() {

  //     })

  //   })

  // })

  describe(`post the feedback test -> ${COMMON_API}`, function() {

    describe(`post the feedback success test -> ${COMMON_API}`, function() {

      it(`post the feedback test success`, function(done) {

        Request
        .post(COMMON_API)
        .send({
          content: {
            text: COMMON_API,
            image: [ imageId.toString() ],
            video: []
          }
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

    describe(`post the feedback fail test -> ${COMMON_API}`, function() {

      describe(`post the feedback fail because the feedback is frequently -> ${COMMON_API}`, function() {

        before(async function() {
          console.log(userId)
          const { model } = mockCreateFeedback({
            user_info: userId,
            content: {
              text: COMMON_API,
              image: [ ObjectId('53102b43bf1044ed8b0ba36b') ]
            }
          })

          const res = await model.save()
          .then(function(data) {
            result = data
            return true
          })
          .catch(err => {
            console.log('oops: ', err)
            return false
          })

          return res ? Promise.resolve() : Promise.reject()

        })

        it(`post the feedback test fail because the feedback is frequently`, function(done) {

          Request
          .get(`${COMMON_API}/precheck`)
          .set({
            Accept: 'Application/json',
            Authorization: `Basic ${selfToken}`
          })
          .expect(503)
          .expect('Content-Type', /json/)
          .end(function(err) {
            if(err) return done(err)
            done()
          })

        })

      })

      describe(`post the feedback test fail because of the params -> ${COMMON_API}`, function() {

        before(function(done) {

          FeedbackModel.deleteMany({
            "content.text": COMMON_API
          })
          .then(function() {
            done()
          })
          .catch(err => {
            console.log('oops: ', err)
          })

        })

        it(`post the feedback test fail because the content is empty`, function(done) {

          Request
          .post(COMMON_API)
          .send({
            content: {
              text: '',
              image: [],
              video: []
            }
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
  
        it(`post the feedback test fail because the content of image or video is not objectId`, function(done) {

          const id = imageId.toString()

          Request
          .post(COMMON_API)
          .send({
            content: {
              text: COMMON_API,
              image: [ id.slice(1) ],
              video: []
            }
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

      })

    })

  })

  describe(`get the info of the user whether send the feedback -> ${COMMON_API}`, function() {

    describe(`get the info of the user whether send the feedback success test -> ${COMMON_API}`, function() {

      it(`get the info of the user whether send the feedback suuccess`, function(done) {

        Request
        .get(`${COMMON_API}/precheck`)
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
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
          responseExpect(obj)
          done()
        })

      })

    })

    describe(`get the info of the user whether send the feedback fail test -> ${COMMON_API}`, function() {

      it(`get the info of the user whether send the feedback fail`, function(done) {

        done()

      })

    })

  })

})
