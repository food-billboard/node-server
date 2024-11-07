require('module-alias/register')
const { 
  UserModel, 
  ScreenModal,
  ScreenShotModel
} = require('@src/utils')
const { expect } = require('chai')
const { 
  Request, 
  mockCreateUser, 
  mockCreateScreenShot,
  mockCreateScreen
} = require('@test/utils')

const COMMON_API = '/api/screen/shot/cover'

describe(`${COMMON_API} test`, () => {

  let userInfo
  let anotherUserInfo
  let selfToken
  let shotId
  let screenId
  let anotherScreenId
  let getToken

  before(function(done) {

    const { model: user, signToken } = mockCreateUser({
      username: COMMON_API,
    })
    const { model: otherUser } = mockCreateUser({
      username: COMMON_API,
    })

    getToken = signToken

    Promise.all([
      user.save(),
      otherUser.save()
    ])
    .then(([user, otherUser]) => {
      const { model: screen } = mockCreateScreen({
        user: user._id,
        data: "{a: 1}"
      })
      const { model: otherScreen } = mockCreateScreen({
        user: otherUser._id,
      })
      userInfo = user 
      selfToken = getToken(userInfo._id)
      anotherUserInfo = otherUser
      return Promise.all([
        screen.save(),
        otherScreen.save()
      ])
    })
    .then(([screen, otherScreen]) => {
      screenId = screen._id
      anotherScreenId = otherScreen._id 
      const { model: shot } = mockCreateScreenShot({
        screen: screenId,
        user: userInfo._id,
        description: COMMON_API,
      })
      return shot.save()
    })
    .then((shot) => {
      shotId = shot._id 
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
      ScreenModal.deleteMany({
        user: {
          $in: [userInfo._id, anotherUserInfo._id]
        }
      }),
      ScreenShotModel.deleteMany({
        user: {
          $in: [userInfo._id, anotherUserInfo._id]
        }
      })
    ])
    .then(_ => {
      done()
    })
    .catch(err => {
      console.log('oops: ', err)
    })

  })

  describe(`post new screen shot success test -> ${COMMON_API}`, function() {

    after(function(done) {

      ScreenShotModel.findOne({
        screen: screenId,
      })
      .select({
        _id: 1,
        data: 1 
      })
      .exec()
      .then(data => {
        expect(!!data).to.be.true
        expect(data.data.includes("a: 1")).to.be.true
        done()
      })
      .catch(err => {
        console.log('oops: ', err)
        done(err)
      })

    })

    it(`post new screen shot success`, function(done) {

      Request
      .post(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        _id: shotId.toString(),
        screen: screenId.toString()
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        done()
      })

    })

  })

  describe(`post new screen shot fail test -> ${COMMON_API}`, function() {

    it(`post screen shot fail because _id is not verify`, function(done) {

      Request
      .post(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        _id: shotId.toString().slice(1),
        screen: screenId.toString()
      })
      .expect(400)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        done()
      })

    })

    it(`post screen shot fail because lack of the _id`, function(done) {

      Request
      .post(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({})
      .expect(400)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        done()
      })

    })

    it(`post screen shot fail because the screen is not self`, function(done) {

      Request
      .post(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        _id: shotId.toString(),
        screen: anotherScreenId.toString()
      })
      .expect(400)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        done()
      })

    })

  })

})
