require('module-alias/register')
const { UserModel, ImageModel } = require('@src/utils')
const { expect } = require('chai')
const { Request, commonValidate, mockCreateUser, mockCreateImage } = require('@test/utils')
const { Types: { ObjectId } } = require("mongoose")

const COMMON_API = '/api/manage/user/detail'

function responseExpect(res, validate=[]) {
  const { res: { data: target } } = res

  expect(target).to.be.a('object').and.that.include.all.keys('_id', 'createdAt', 'updatedAt', 'mobile', 'email', 'username', 'description', 'avatar', 'hot', 'status', 'roles', 'fans_count', 'attentions_count', 'issue_count', 'comment_count', 'store_count')
  commonValidate.objectId(target._id)
  commonValidate.date(target.createdAt)
  commonValidate.date(target.updatedAt)
  commonValidate.number(target.mobile)
  commonValidate.string(target.email)
  commonValidate.string(target.username)
  commonValidate.string(target.description)
  commonValidate.poster(target.avatar)
  commonValidate.number(target.hot)
  commonValidate.string(target.status)
  expect(target.roles).to.be.a('array')
  target.roles.forEach(role => commonValidate.string(role))
  commonValidate.number(target.fans_count)
  commonValidate.number(target.attentions_count)
  commonValidate.number(target.issue_count)
  commonValidate.number(target.comment_count)
  commonValidate.number(target.store_count)

  if(Array.isArray(validate)) {
    validate.forEach(valid => {
      typeof valid == 'function' && valid(target)
    })
  }else if(typeof validate === 'function') {
    validate(target)
  }
}

describe(`${COMMON_API} test`, function() {
  
  let userInfo
  let selfToken
  let otherUserId
  let imageId
  let getToken

  before(function(done) {

    const { model } = mockCreateImage({
      src: COMMON_API
    })

    model.save()
    .then(data => {
      imageId = data._id

      const { model:user, signToken } = mockCreateUser({
        username: COMMON_API
      })
      const { model:other } = mockCreateUser({
        username: COMMON_API
      })

      getToken = signToken

      return Promise.all([
        user.save(),
        other.save()
      ])
    })
    .then(([user, other]) => {
      userInfo = user
      otherUserId = other._id
      selfToken = getToken(userInfo._id)
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
      ImageModel.deleteMany({
        src: COMMON_API
      })
    ])
    .then(_ => {
      done()
    })
    .catch(err => {
      console.log('oops: ', err)
    })

  })

  describe(`${COMMON_API} success test`, function() {

    it(`get the user info success`, function(done) {

      Request
      .get(COMMON_API)
      .set({
        Accept: 'Application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
        _id: otherUserId.toString()
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

  describe(`${COMMON_API} fail test`, function() {
    
    it(`get the user info fail because the id is not verify`, function(done) {

      Request
      .get(COMMON_API)
      .set({
        Accept: 'Application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
        _id: otherUserId.toString().slice(1)
      })
      .expect(400)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        done()
      })

    })

    it(`get the user info fail because the id is not found`, function(done) {

      const id = otherUserId.toString()

      Request
      .get(COMMON_API)
      .set({
        Accept: 'Application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
        _id: `${id.slice(1)}${Math.ceil(10 / (parseInt(id.slice(0, 1)) + 5))}`
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