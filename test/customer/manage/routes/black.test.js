require('module-alias/register')
const { expect } = require('chai')
const { mockCreateUser, Request, commonValidate } = require('@test/utils')
const { UserModel } = require('@src/utils')

const COMMON_API = '/api/customer/manage/black'

function responseExpect(res, validate=[]) {

  const { res: { data: target } } = res

  expect(target).to.be.a('object').and.that.includes.all.keys('black')
  target.black.forEach(item => {
    expect(item).to.be.a('object').and.that.includes.all.keys('avatar', 'username', '_id')
    commonValidate.poster(item.avatar)
    commonValidate.string(item.username)
    commonValidate.objectId(item._id)
  })

  if(Array.isArray(validate)) {
    validate.forEach(valid => {
      typeof valid == 'function' && valid(target)
    })
  }else if(typeof validate == 'function') {
    validate(target)
  }
}

describe(`${COMMON_API} test`, function() {

  let result
  let selfToken
  let userId

  before(async function() {

    const { model:user } = mockCreateUser({
      username: COMMON_API,
    })
  
    const { model: self, signToken } = mockCreateUser({
      username: COMMON_API,
      description: COMMON_API
    })

    await Promise.all([
      self.save(),
      user.save()
    ])
    .then(([self, user]) => {
      userId = user._id
      result = self
      selfToken = signToken(self._id)
      return UserModel.updateOne({
        username: COMMON_API,
        description: COMMON_API
      }, {
        $set: {
          black: [ { _id: userId, timestamps: Date.now() } ]
        }
      })
    })
    .catch(err => {
      console.log('oops: ', err)
    })

    return Promise.resolve()

  })

  after(async function() {

    await UserModel.deleteMany({
      username: COMMON_API
    })
    .catch(err => {
      console.log('oops: ', err)
    })

    return Promise.resolve()

  })

  describe(`pre check the params test -> ${COMMON_API}`, function() {

    describe(`pre check params fail test -> ${COMMON_API}`, function() {

      it(`pre check params fail becasue of the user id is not verify`, function(done) {

        Request
        .put(COMMON_API)
        .send({
          _id: userId.toString().slice(1)
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

      it(`pre check params fail becasue lack of the user id`, function(done) {

        Request
        .delete(COMMON_API)
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

  describe(`get self black list -> ${COMMON_API}`, function() {

    describe(`get self black list success test -> ${COMMON_API}`, function() {
      
      it(`get self black list success`, function(done) {

        Request
        .get(COMMON_API)
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
          responseExpect(obj, target => {
            expect(target.black.length).not.be.equal(0)
          })
          done()
        })

      })

    })

  })

  describe(`put the new user for black -> ${COMMON_API}`, function() {

    describe(`put the new user for black success test -> ${COMMON_API}`, function() {

      before(function(done) {
        UserModel.updateMany({
          username: COMMON_API
        }, {
          black: []
        })
        .then(function() {
          done()
        })
        .catch(err => {
          console.log('oops: ', err)
        })
      })

      after(function(done) {
        UserModel.findOne({
          _id: result._id,
          "black._id": { $in: [ userId ] }
        })
        .select({
          _id: 0,
          black: 1
        })
        .exec()
        .then((user) => {
          return !!user
        })
        .then(result => {
          if(result) return done()
          done(new Error(COMMON_API))
        })
      })

      it(`put the new user for black success`, function(done) {

        Request
        .put(COMMON_API)
        .send({
          _id: userId
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

    describe(`put the new user for black success but not write success test -> ${COMMON_API}`, function() {

      before(function(done) {
        UserModel.updateMany({
          username: COMMON_API,
          description: COMMON_API
        }, {
          black: [ { _id: userId, timestamps: Date.now() } ]
        })
        .then(function() {
          done()
        })
        .catch(err => {
          console.log('oops: ', err)
        })
      })

      after(function(done) {
        UserModel.findOne({
          _id: result._id,
          "black._id": { $in: [ userId ] }
        })
        .select({
          _id: 0,
          black: 1
        })
        .exec()
        .then(user => {
          return !!user && user.black.length == 1
        })
        .then(result => {
          if(result) return done()
          done(new Error(COMMON_API))
        })
      })

      it(`put the new user for black fail but the user is blacked`, function(done) {

        Request
        .put(COMMON_API)
        .send({
          _id: userId.toString()
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

    })

  })

  describe(`cancel the user black -> ${COMMON_API}`, function() {

    describe(`cancel the new user for black success test -> ${COMMON_API}`, function() {

      before(function(done) {
        UserModel.updateMany({
          _id: result._id,
          username: COMMON_API,
          description: COMMON_API
        }, {
          $set: {
            black: [ { _id: userId, timestamps: Date.now() } ]
          }
        })
        .then(function() {
          done()
        })
        .catch(err => {
          console.log('oops: ', err)
        })
      })

      after(async function() {
        const res = await UserModel.findOne({
          _id: result._id,
          black: []
        })
        .select({
          _id: 1,
          black: 1
        })
        .exec()
        .then(user => {
          return !!user
        })
        .catch(err => {
          console.log('oops: ', err)
          return false
        })

        return res ? Promise.resolve() : Promise.reject(COMMON_API)

      })

      it(`cancel the new user for black success`, function(done) {

        Request
        .delete(COMMON_API)
        .query({
          _id: userId.toString()
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

    describe(`cancel the new user for black success but not write database test -> ${COMMON_API}`, function() {

      before(function(done) {
        UserModel.updateMany({
          username: COMMON_API,
          description: COMMON_API
        }, {
          black: []
        })
        .then(function() {
          done()
        })
        .catch(err => {
          console.log('oops: ', err)
        })
      })

      after(function(done) {
        UserModel.findOne({
          _id: result._id,
          black: []
        })
        .select({
          _id: 0,
          black: 1
        })
        .exec()
        .then(user => {
          return !!user
        })
        .then(result => {
          if(result) return done()
          done(new Error(COMMON_API))
        })
      })

      it(`cancel the new user for black fail because the user is not blacked`, function(done) {
        
        Request
        .delete(COMMON_API)
        .query({
          _id: userId.toString()
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

    })

  })

})