require('module-alias/register')
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

const COMMON_API = '/api/screen/shot'

function responseExpect(res, validate=[]) {
  const { res: { data: target } } = res

  expect(target).to.be.a('object').and.that.includes.all.keys('total', 'list')
  target.list.forEach(item => {
    expect(item).to.be.a('object').that.includes.any.keys('_id', 'description', 'user', 'createdAt', 'updatedAt', 'username', 'avatar')
    commonValidate.objectId(item._id)
    commonValidate.string(item.description)
    commonValidate.string(item.username)
    commonValidate.string(item.avatar)
    commonValidate.objectId(item.user)
    commonValidate.date(item.createdAt)
    commonValidate.date(item.updatedAt)
  })

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
  let anotherUserInfo
  let selfToken
  let shotId
  let anotherShotId
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
        user: user._id
      })
      const { model: otherScreen } = mockCreateScreen({
        user: otherUser._id
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
      const { model: otherShot } = mockCreateScreenShot({
        screen: anotherScreenId,
        user: anotherUserInfo._id,
        description: COMMON_API,
      })
      return Promise.all([
        shot.save(),
        otherShot.save()
      ])
    })
    .then(([shot, otherShot]) => {
      shotId = shot._id 
      anotherShotId = otherShot._id 
      return Promise.all([
        ScreenModal.updateOne({
          _id: screenId,
        }, {
          $set: {
            screen_shot: shotId
          }
        }),
        ScreenModal.updateOne({
          _id: screenId,
        }, {
          $set: {
            screen_shot: anotherShotId
          }
        })
      ])
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
  
  describe(`get the screen shot list success test -> ${COMMON_API}`, function() {

    it(`get the screen shot success`, function(done) {

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
        responseExpect(obj, (target) => {
          expect(target.list.length).to.be.not.equals(0)
        })
        done()
      })

    })

    it(`get the screen shot success with content`, function(done) {

      Request
      .get(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
        _id: screenId.toString(),
        content: COMMON_API
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
        responseExpect(obj, (target) => {
          expect(target.list.length).to.be.not.equals(0)
        })
        done()
      })

    })

  })

  describe(`post new screen shot success test -> ${COMMON_API}`, function() {

    const description = COMMON_API + Date.now()

    after(function(done) {

      ScreenShotModel.findOne({
        screen: screenId,
        description
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
        _id: screenId.toString(),
        description
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        done()
      })

    })

  })

  describe(`put new screen shot success test -> ${COMMON_API}`, function() {

    const description = COMMON_API + Date.now()

    after(function(done) {

      ScreenShotModel.findOne({
        screen: screenId,
        description
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

    it(`put new screen shot success`, function(done) {

      Request
      .put(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        _id: shotId.toString(),
        description,
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

  describe(`delete the screen shot success test -> ${COMMON_API}`, function() {

    let shotId
    let screenId

    before(function(done) {

      const { model: screen } = mockCreateScreen({
        user: userInfo._id
      })

      screen.save()
      .then((screen) => {
        screenId = screen._id 
        const { model: shot } = mockCreateScreenShot({
          user: userInfo._id,
          screen: screenId
        })
        return shot.save()
      })
      .then(shot => {
        shotId = shot._id 
        done()
      })
      .catch(err => {
        console.log('oops: ', err)
      })

    })

    after(function(done) {

      ScreenShotModel.find({
        _id: { $in: [shotId] }
      })
      .select({
        _id: 1
      })
      .exec()
      .then(data => {
        expect(!!data.length).to.be.false
        done()
      })
      .catch(async (err) => {
        console.log('oops: ', err)
        await ScreenShotModel.deleteMany({ _id: { $in: [ shotId ] } })
        done(err)
      })

    })

    it(`delete the screen shot success`, function(done) {

      Request
      .delete(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
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
        _id: screenId.toString().slice(1),
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
        _id: anotherScreenId.toString(),
      })
      .expect(400)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        done()
      })

    })

  })

  describe(`put new screen shot fail test -> ${COMMON_API}`, function() {

    it(`put screen shot fail because _id is not verify`, function(done) {

      Request
      .put(COMMON_API)
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

    it(`put screen shot fail because lack of the _id`, function(done) {

      Request
      .post(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        screen: screenId.toString()
      })
      .expect(400)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        done()
      })

    })

    it(`put screen shot fail because the screen is not self`, function(done) {

      Request
      .post(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        _id: anotherShotId.toString(),
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

  describe(`delete the screen shot fail test -> ${COMMON_API}`, function() {
    
    it(`delete screen shot fail because _id is not verify`, function(done) {

      Request
      .delete(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
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

    it(`delete screen shot fail because lack of the _id`, function(done) {

      Request
      .delete(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
        screen: screenId.toString()
      })
      .expect(400)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        done()
      })

    })

    it(`delete screen shot fail because the screen is not self`, function(done) {

      Request
      .delete(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
        _id: anotherShotId.toString(),
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
