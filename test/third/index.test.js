require('module-alias/register')
const { expect } = require('chai')
const { UserModel, ThirdPartyModel, THIRD_PARTY_REQUEST_METHOD } = require('@src/utils')
const { Types: { ObjectId } } = require('mongoose')
const { Request, commonValidate, mockCreateUser, parseResponse, mockCreateThird, deepParseResponse } = require('@test/utils')

const COMMON_API = '/api/third'

function responseExpect(res, validate=[]) {
  const { res: { data: { list, total } } } = res

  commonValidate.number(total)
  expect(list).to.be.a("array")

  list.forEach(item => {
    expect(item).to.be.a("object").and.that.include.any.keys("example", "name", "_id", "description", "user", "url", "method", "headers", "getter", "params", "createdAt", "updatedAt")
    commonValidate.objectId(item._id)
    commonValidate.string(item.name)
    commonValidate.string(item.description)
    commonValidate.string(item.url)
    commonValidate.string(item.method)
    commonValidate.date(item.createdAt)
    commonValidate.date(item.updatedAt)
    expect(item.user).to.be.a('object').and.that.includes.any.keys('username', 'avatar', '_id')
    commonValidate.string(item.user.username)
    commonValidate.poster(item.user.avatar)
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
  let thirdId 
  let getToken
  const commonParams = {
    name: COMMON_API,
    description: '测试第三方名称',
    url: '/api/third',
    method: THIRD_PARTY_REQUEST_METHOD.POST,
  }

  before(function(done) {

    const { model, signToken } = mockCreateUser({
      username: COMMON_API,
    })

    getToken = signToken

    model.save()
    .then((user) => {
      userInfo = user
      selfToken = getToken(userInfo._id)
      const { model } = mockCreateThird({
        name: COMMON_API,
        user: userInfo._id,
      }) 
      return model.save()  
    })
    .then(data => {
      thirdId = data._id 
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
      ThirdPartyModel.deleteMany({
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
  
  describe(`get the third list success test -> ${COMMON_API}`, function() {

    it(`get the third list success with content`, function(done) {

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
          expect(list.some(item => item._id === thirdId.toString())).to.be.true 
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

  describe(`delete third success -> ${COMMON_API}`, function() {

    it(`delete third success`, function(done) {

      const { model } = mockCreateThird({
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

  describe(`post the third success test -> ${COMMON_API}`, function() {

    it(`post the third success`, (done) => {
      Request
      .post(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        ...commonParams
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .then(function(res) {
        let obj = deepParseResponse(res)
        return ThirdPartyModel.findOne({
          _id: ObjectId(obj._id)
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

  describe(`put the third success test -> ${COMMON_API}`, function() {
    
    it(`put the third success`, (done) => {
      const newDescription = COMMON_API + '_name'
      Request
      .put(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        _id: thirdId.toString(),
        ...commonParams,
        description: newDescription
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .then(function(res) {
        let obj = deepParseResponse(res)
        return ThirdPartyModel.findOne({
          _id: thirdId,
          description: newDescription
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

  describe(`post the third fail test -> ${COMMON_API}`, function() {

    it(`post the third fail because the name is not valid`, (done) => {
      Request
      .post(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        ...commonParams,
        name: ''
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

    it(`post the third fail because the url is not valid`, (done) => {
      Request
      .post(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        ...commonParams,
        url: ''
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

    it(`post the third fail because the method is not valid`, (done) => {
      Request
      .post(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        ...commonParams,
        method: ''
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


  describe(`delete the third fail test -> ${COMMON_API}`, function() {

    it(`delete third fail because the id is not valid`, function(done) {
      Request
      .delete(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
        _id: thirdId.toString().slice(1)
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

    it(`delete third fail because the id is not found`, function(done) {

      const id = thirdId.toString()

      Request
      .delete(COMMON_API)
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

  })

})