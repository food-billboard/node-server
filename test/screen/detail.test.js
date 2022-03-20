require('module-alias/register')
const { expect } = require('chai')
const { Types: { ObjectId } } = require('mongoose')
const { UserModel, ScreenModal, fileEncoded, MEDIA_AUTH } = require('@src/utils')
const { Request, mockCreateUser, mockCreateScreen, parseResponse, commonValidate } = require('@test/utils')

const COMMON_API = '/api/screen/detail'

function responseExpect(res, validate=[]) {
  const { res: { data: target } } = res

  expect(target).to.be.a("object").and.that.includes.any.keys('_id', 'name', 'description', 'poster', 'components')
  commonValidate.objectId(target._id)
  commonValidate.string(target.name)
  commonValidate.string(target.description)
  commonValidate.poster(target.poster)
  expect(target.components).to.be.a('object')

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
  let screenId
  let selfToken
  let getToken

  before(function(done) {

    const { model, signToken } = mockCreateUser({
      username: COMMON_API
    })

    getToken = signToken

    model.save()
    .then((user) => {
      userInfo = user
      selfToken = getToken(userInfo._id)

      const { model } = mockCreateScreen({
        name: COMMON_API,
        user: userInfo._id,
        enable: true 
      })

      return model.save()

    })
    .then(data => {
      screenId = data._id 
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
      ScreenModal.deleteMany({
        name: COMMON_API
      }),
      UserModel.deleteMany({
        username: COMMON_API
      }),
    ])
    .then(_ => {
      done()
    })
    .catch(err => {
      done(err)
    })

  })
  
  describe(`get the screen detail success test -> ${COMMON_API}`, function() {

    it(`get the screen detail success`, function(done) {

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
      .then(function(res) {
        let obj = parseResponse(res)
        responseExpect(obj)
      })
      .then(_ => {
        done()
      })
      .catch(err => {
        done(err)
      })

    })


    it(`get screen detail success and the creator is not self but is share get`, function(done) {

      Request
      .post('/api/screen/share')
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        _id: screenId.toString(),
        auth: MEDIA_AUTH.PRIVATE,
        time: 3000,
        password: COMMON_API
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .then(_ => {
        return Request
        .post('/api/screen/share/valid')
        .set({
          Accept: 'application/json',
        })
        .send({
          _id: screenId.toString(),
          password: COMMON_API
        })
        .expect(200)
        .expect('Content-Type', /json/)
      })
      .then(_ => {
        return ScreenModal.updateMany({
          name: COMMON_API
        }, {
          $set: {
            user: ObjectId('5edb3c7b4f88da14ca419e61')
          }
        })
      })
      .then(_ => {
        return Request
        .get(COMMON_API)
        .set({
          Accept: 'application/json',
          Cookie: 'share_cookie_key' + '=' + fileEncoded(COMMON_API),
          'user-agent': COMMON_API
        })
        .query({
         _id: screenId.toString() 
        })
        .expect(200)
        .expect('Content-Type', /json/)
      })
      .then(_ => {
        return ScreenModal.updateMany({
          name: COMMON_API
        }, {
          $set: {
            user: userInfo._id 
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

  describe(`get the screen detail fail test -> ${COMMON_API}`, function() {

    it(`get screen detail fail because the id is not valid`, function(done) {

      Request
      .get(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
       _id: screenId.toString().slice(1)
      })
      .expect(400)
      .expect('Content-Type', /json/)
      .then(_ => {
        done()
      })
      .catch(err => {
        done(err)
      })

    })

    it(`get screen detail fail because the id is not found`, function(done) {

      const id = screenId.toString()

      Request
      .get(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
       _id: `${(id.slice(0, 1) + 4) % 10}${id.slice(1)}`
      })
      .expect(404)
      .expect('Content-Type', /json/)
      .then(_ => {
        done()
      })
      .catch(err => {
        done(err)
      })

    })

    it(`get screen detail fail because the creator is not self and not share get`, function(done) {

      ScreenModal.updateOne({
        name: COMMON_API
      }, {
        user: ObjectId('8f63270f005f1c1a0d9448ca')
      })
      .then(_ => {
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
      })
      .then(_ => {
        return ScreenModal.updateOne({
          name: COMMON_API
        }, {
          user: userInfo._id 
        })
      })
      .then(_ => {
        done()
      })
      .catch(err => {
        done(err)
      })

    })

    it(`get screen detail fail because the user-agent is not equal the cookie`, function(done) {

      Request
      .post('/api/screen/share')
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        _id: screenId.toString(),
        auth: MEDIA_AUTH.PRIVATE,
        time: 3000,
        password: COMMON_API
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .then(_ => {
        return Request
        .post('/api/screen/share/valid')
        .set({
          Accept: 'application/json',
        })
        .send({
          _id: screenId.toString(),
          password: COMMON_API
        })
        .expect(200)
        .expect('Content-Type', /json/)
      })
      .then(_ => {
        return ScreenModal.updateMany({
          name: COMMON_API
        }, {
          $set: {
            user: ObjectId('5edb3c7b4f88da14ca419e61')
          }
        })
      })
      .then(_ => {
        return Request
        .get(COMMON_API)
        .set({
          Accept: 'application/json',
          Cookie: 'share_cookie_key' + '=' + fileEncoded(COMMON_API),
          'user-agent': '22222'
        })
        .query({
         _id: screenId.toString() 
        })
        .expect(403)
        .expect('Content-Type', /json/)
      })
      .then(_ => {
        return ScreenModal.updateMany({
          name: COMMON_API
        }, {
          $set: {
            user: userInfo._id 
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

})