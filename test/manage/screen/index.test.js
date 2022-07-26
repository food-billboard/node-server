require('module-alias/register')
const { expect } = require('chai')
const { UserModel, ScreenModal } = require('@src/utils')
const Day = require('dayjs')
const { Request, commonValidate, mockCreateUser, parseResponse, mockCreateScreen } = require('@test/utils')

const COMMON_API = '/api/manage/screen/list'

function responseExpect(res, validate=[]) {
  const { res: { data: { list, total } } } = res

  commonValidate.number(total)
  expect(list).to.be.a("array")

  list.forEach(item => {
    expect(item).to.be.a("object").and.that.include.any.keys("version", "_id", "name", "user", "enable", "flag", "description", "poster", "createdAt", "updatedAt")
    commonValidate.objectId(item._id)
    commonValidate.string(item.name)
    commonValidate.string(item.description)
    commonValidate.string(item.flag)
    commonValidate.string(item.version)
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
      username: COMMON_API,
    })

    getToken = signToken

    model.save()
    .then((user) => {
      userInfo = user
      selfToken = getToken(userInfo._id)
      const { model } = mockCreateScreen({
        name: COMMON_API,
        user: userInfo._id,
        enable: true,
        version: '1.5'
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
          const { total, list } = target.data 
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

    it(`get the screen list success with content for version`, function(done) {

      Request
      .get(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
        content: '1.5'
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .then(function(res) {
        let obj = parseResponse(res)
        responseExpect(obj, (target) => {
          const { total, list } = target.data 
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

    it(`get the screen list success with enable`, function(done) {

      Request
      .get(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
        enable: '1'
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .then(function(res) {
        let obj = parseResponse(res)
        responseExpect(obj, (target) => {
          const { total, list } = target.data 
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

    it(`get the screen list success with createdAt`, function(done) {

      Request
      .get(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
        createdAt: [Day().add(1, 'day').format('YYYY-MM-DD'), Day().add(2, 'day').format('YYYY-MM-DD')]
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .then(function(res) {
        let obj = parseResponse(res)
        responseExpect(obj, (target) => {
          const { total, list } = target.data 
          expect(total).to.be.equals(0)
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

})