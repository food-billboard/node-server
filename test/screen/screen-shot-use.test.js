require('module-alias/register')
const mongoose = require('mongoose')
const { 
  UserModel, 
  ScreenModal,
  ScreenShotModel
} = require('@src/utils')
const { expect } = require('chai')
const { 
  Request, 
  commonValidate, 
  mockCreateUser, 
  mockCreateScreenShot,
  mockCreateScreen
} = require('@test/utils')

const { Types: { ObjectId } } = mongoose

const COMMON_API = '/api/screen/shot/use'

function responseExpect(res, validate=[]) {
  const { res: { data: target } } = res

  expect(target).to.be.a('object').that.includes.any.keys('data')

  if(Array.isArray(validate)) {
    validate.forEach(valid => {
      typeof valid == 'function' && valid(target)
    })
  }else if(typeof validate === 'function') {
    validate(target)
  }
}

describe(`${COMMON_API} test`, () => {

  let userInfo
  let selfToken
  let shotId
  let screenId
  let otherScreenId
  let getToken

  before(function(done) {

    const { model, signToken } = mockCreateUser({
      username: COMMON_API,
    })

    getToken = signToken

    model.save()
    .then((user) => {
      const { model: screen } = mockCreateScreen({
        user: user._id
      })
      const { model: otherScreen } = mockCreateScreen({
        user: ObjectId('8f63270f005f1c1a0d9448ca')
      })
      userInfo = user 
      selfToken = getToken(userInfo._id)
      return Promise.all([
        screen.save(),
        otherScreen.save()
      ])
    })
    .then(([screen, otherScreen]) => {
      screenId = screen._id
      otherScreenId = otherScreen._id 
      const { model: shot } = mockCreateScreenShot({
        screen: screenId,
        user: userInfo._id,
        description: COMMON_API,
      })
      return shot.save()
    })
    .then((shot) => {
      shotId = shot._id 
      return ScreenModal.updateOne({
        _id: screenId,
      }, {
        $set: {
          screen_shot: shotId
        }
      })
    })
    .then(() => {
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
          $in: [userInfo._id, otherScreenId]
        }
      }),
      ScreenShotModel.deleteMany({
        user: {
          $in: [userInfo._id]
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
  
  describe(`get the screen shot use success test -> ${COMMON_API}`, function() {

    it(`get the screen shot use success`, function(done) {

      Request
      .get(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
        _id: screenId.toString()
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

  describe(`post new screen shot success test -> ${COMMON_API}`, function() {

    after(function(done) {

      ScreenModal.findOne({
        _id: screenId,
        screen_shot: shotId
      })
      .select({
        _id: 1
      })
      .exec()
      .then(data => {
        expect(!!data).to.be.true
        done()
      })
      .catch(err => {
        console.log('oops: ', err)
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
        screen: screenId.toString(),
        _id: shotId.toString()
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        done()
      })

    })

  })

  describe(`get the screen shot list fail test -> ${COMMON_API}`, function() {

    it(`get the screen shot list fail because lack of the params`, function(done) {

      Request
      .get(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .expect(400)
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
        screen: otherScreenId.toString()
      })
      .expect(404)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        done()
      })

    })

  })

})
