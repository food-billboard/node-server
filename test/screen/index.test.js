require('module-alias/register')
const { expect } = require('chai')
const { UserModel, ScreenModal, SCREEN_TYPE } = require('@src/utils')
const { Types: { ObjectId } } = require('mongoose')
const { Request, commonValidate, mockCreateUser, parseResponse, deepParseResponse, mockCreateScreen } = require('@test/utils')

const COMMON_API = '/api/screen/list'

function responseExpect(res, validate=[]) {
  const { res: { list, total } } = res

  commonValidate.number(total)
  expect(list).to.be.a("array")

  list.forEach(item => {
    expect(item).to.be.a("object").and.that.include.any.keys("_id", "name", "user", "enable", "flag", "description", "poster", "createdAt", "updatedAt")
    commonValidate.objectId(item._id)
    commonValidate.string(item.name)
    commonValidate.string(item.description)
    commonValidate.string(item.flag)
    commonValidate.poster(item.poster)
    expect(item.enable).to.be.a('boolean')
    commonValidate.date(item.createdAt)
    commonValidate.date(item.updatedAt)
    expect(item.user).to.be.a('object').and.that.includes.any.keys('username', 'avatar', '_id')
    commonValidate.string(item.user.username)
    commonValidate.poster(item.user.poster)
    commonValidate.objectId(item.user._id)
  })

  if(Array.isArray(validate)) {
    validate.forEach(valid => {
      typeof valid == 'function' && valid(res.res)
    })
  }else if(typeof validate === 'function') {
    validate(res.res)
  }
}

describe(`${COMMON_API} test`, () => {

  let userInfo
  let selfToken
  let screenId 
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
        user: userInfo._id 
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
  
  describe(`get the screen list success test -> ${COMMON_API}`, function() {

    it(`get the screen list success with content`, function(done) {

      Request
      .get(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
        content: COMMON_API.slice(0, 4)
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .then(function(res) {
        let obj = parseResponse(res)
        responseExpect(obj, (target) => {
          const { total, list } = target 
          expect(total).to.be.not.equals(0)
          expect(list.some(item => item._id === screenId.toString())).to.be.true 
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

  describe('delete screen success', function() {

    it(`delete screen success`, function(done) {

      const { model } = mockCreateScreen({
        name: COMMON_API,
        user: userInfo._id 
      }) 
      model.save()  
      .then(data => {
        return Request
        .delete(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .query({
          _id: data._id.toString()
        })
        .expect(200)
        .expect('Content-Type', /json/)
      })
      .then(_ => {
        done()
      })
      .catch(err => {
        done(err)
      })

    })

  })

  describe('post screen success test', function() {

    it('post screen success', function(done) {

      Request
      .post(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        name: COMMON_API,
        description: COMMON_API,
        flag: SCREEN_TYPE.PC,
        data: JSON.stringify({
          components: []
        }),
        poster: 'http://sss.png'
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .then(_ => {
        return ScreenModal.findOne({
          name: COMMON_API,
          description: COMMON_API
        })
        .select({
          _id: 1
        })
        .exec()
      })
      .then(data => {
        expect(!!data).to.be.true 
      })
      .then(_ => {
        done()
      })
      .catch(err => {
        done(err)
      })
      
    })

  })

  describe('put screen success test', function() {

    it('put screen success', function(done) {
      const newData = COMMON_API + 'edit'

      Request
      .put(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        _id: screenId.toString(),
        name: COMMON_API,
        description: newData,
        flag: SCREEN_TYPE.PC,
        data: JSON.stringify({
          components: []
        }),
        poster: 'http://333.png'
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .then(_ => {
        return ScreenModal.findOne({
          name: COMMON_API,
          description: newData
        })
        .select({
          _id: 1
        })
        .exec()
      })
      .then(data => {
        expect(!!data).to.be.true 
      })
      .then(_ => {
        done()
      })
      .catch(err => {
        done(err)
      })
    })

  })

  describe(`delete the screen fail test -> ${COMMON_API}`, function() {

    it(`delete screen fail because the id is not valid`, function(done) {
      Request
      .delete(COMMON_API)
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

    it(`delete screen fail because the id is not found`, function(done) {

      const id = screenId.toString()

      Request
      .delete(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
        _id: `${(id.slice(0, 1) + 4) % 10}${id.slice(1)}`
      })
      .expect(403)
      .expect('Content-Type', /json/)
      .then(_ => {
        done()
      })
      .catch(err => {
        done(err)
      })
    })

  })

  describe(`post screen fail test`, function() {

    it(`post screen fail because the name's length is too short`, (done) => {

      Request
      .post(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        name: '',
        description: COMMON_API,
        flag: SCREEN_TYPE.PC,
        data: JSON.stringify({
          components: []
        }),
        poster: 'http://sss.png'
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

    it(`post screen fail because the name's length is too long`, (done) => {
      Request
      .post(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        name: COMMON_API.repeat(20),
        description: COMMON_API,
        flag: SCREEN_TYPE.PC,
        data: JSON.stringify({
          components: []
        }),
        poster: 'http://sss.png'
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

    it(`post screen fail because the data is not json`, (done) => {
      Request
      .post(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        name: COMMON_API,
        description: COMMON_API,
        flag: SCREEN_TYPE.PC,
        data: '',
        poster: 'http://sss.png'
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

    it(`post screen fail because the flag is not valid`, (done) => {
      Request
      .post(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        name: COMMON_API,
        description: COMMON_API,
        flag: '',
        data: JSON.stringify({
          components: []
        }),
        poster: 'http://sss.png'
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

    it(`post screen fail because the poster is not valid`, (done) => {
      Request
      .post(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        name: COMMON_API,
        description: COMMON_API,
        flag: SCREEN_TYPE.PC,
        data: JSON.stringify({
          components: []
        }),
        poster: ''
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

  })

  describe(`put screen fail test`, function() {

    it(`put screen fail because the id is not valid`, (done) => {
      const newData = COMMON_API + 'edit'
      Request
      .put(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        _id: screenId.toString().slice(1),
        name: COMMON_API,
        description: newData,
        flag: SCREEN_TYPE.PC,
        data: JSON.stringify({
          components: []
        }),
        poster: 'http://333.png'
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

    it(`put screen fail because the screen creator is not self`, (done) => {
      const newData = COMMON_API + 'edit'

      ScreenModal.updateMany({
        name: COMMON_API
      }, {
        user: ObjectId('8f63270f005f1c1a0d9448ca')
      })
      .then(_ => {
        return Request
        .put(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .send({
          _id: screenId.toString(),
          name: COMMON_API,
          description: newData,
          flag: SCREEN_TYPE.PC,
          data: JSON.stringify({
            components: []
          }),
          poster: 'http://333.png'
        })
        .expect(403)
        .expect('Content-Type', /json/)
      })
      .then(_ => {
        return ScreenModal.updateMany({
          name: COMMON_API,
        }, {
          user: ObjectId('8f63270f005f1c1a0d9448ca')
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