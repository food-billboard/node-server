require('module-alias/register')
const { UserModel, ImageModel, MEDIA_AUTH, USER_STATUS, ROLES_MAP } = require('@src/utils')
const { Request, mockCreateUser, mockCreateImage, commonValidate } = require('@test/utils')
const { expect } = require('chai')

const COMMON_API = '/api/manage/media/person'

function responseExpect(res, validate=[]) {
  const { res: { data: target } } = res

  expect(target).to.be.a('object').and.that.include.all.keys('list', 'total')
  commonValidate.number(target.total)
  expect(target.list).to.be.a('array')

  target.list.forEach(item => {
    expect(item).to.be.a('object').that.includes.all.keys('_id', 'username', 'createdAt', 'updatedAt', 'mobile', 'email', 'status', 'roles')
    commonValidate.objectId(item._id)
    commonValidate.string(item.username)
    expect(item.mobile.toString().length).to.be.eq(11)
    commonValidate.date(item.createdAt)
    commonValidate.date(item.updatedAt)
    commonValidate.string(item.email)
    commonValidate.string(item.status, (target) => {
      return USER_STATUS.includes(target)
    })
    expect(item.roles).to.be.a('array')
    item.roles.forEach((item) => {
      expect(ROLES_MAP[item] !== undefined).to.be.true
    })

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
  let anotherUserId
  let anotherUser2Id
  let selfToken
  let imageId
  let getToken
  const imageSize = 1024

  before(function(done) {

    const { model } = mockCreateImage({
      src: COMMON_API,
      name: COMMON_API,
      auth: MEDIA_AUTH.PUBLIC,
      info: {
        size: imageSize
      }
    })

    model.save()
    .then((image) => {
      imageId = image._id

      const { model: user, signToken } = mockCreateUser({
        username: COMMON_API,
        avatar: imageId
      })

      const { model: other } = mockCreateUser({
        username: COMMON_API,
      })

      const { model: other1 } = mockCreateUser({
        username: COMMON_API,
      })

      getToken = signToken

      return Promise.all([
        user.save(),
        other.save(),
        other1
      ])

    })
    .then(([user, other, other1]) => {
      userInfo = user
      anotherUserId = other._id
      anotherUser2Id = other1._id
      selfToken = getToken(userInfo._id)
      return ImageModel.updateOne({
        name: COMMON_API,
      }, {
        $set: { 
          origin: userInfo._id,
          white_list: [userInfo._id, anotherUserId, anotherUser2Id]
        }
      })
    })
    .then(_ => {
      done()
    })
    .catch(err => {
      console.log('oops: ', err)
    })

  })

  after(function(done) {

    Promise.all([
      ImageModel.deleteMany({
        $or: [
          {
            src: COMMON_API
          },
          {
            name: COMMON_API
          }
        ]
      }),
      UserModel.deleteMany({
        username: COMMON_API
      })
    ])
    .then(_ => {
      done()
    })
    .catch(err => {
      console.log('oops: ', err)
    })

  })

  describe(`get the media white_list success test -> ${COMMON_API}`, function() {

    it(`get the media white_list success`, function(done) {
      Request
      .get(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
        type: 0,
        _id: imageId.toString(),
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
          expect(target.length).to.be.not.equals(0)
        })
        done()
      })
    })

  })

  describe(`get the media white_list fail test -> ${COMMON_API}`, function() {
    it(`get the media list fail because lack of the type params`, function(done) {

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

    it(`get the media list fail because the type params is not valid`, function(done) {

      Request
      .get(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
        type: 3
      })
      .expect(400)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        done()
      })

    })
  })

  describe(`post the media white_list success test -> ${COMMON_API}`, function() {

    before(function(done) {
      ImageModel.updateOne({
        _id: imageId
      }, {
        $set: [ userInfo._id ]
      })
      .then(_ => {
        done()
      })
      .catch(err => {
        console.log('oops: ', err)
        done(err)
      })
    })

    after(function(done) {
      ImageModel.findOne({
        _id: imageId
      })
      .select({
        white_list: 1
      })
      .exec()
      .then(data => {
        expect(data._doc.white_list.length).to.be.eq(3)
        done()
      })
      .catch(err => {
        console.log('oops: ', err)
        done(err)
      })
    })

    it(`post the media white_list success`, function(done) {
      Request
      .post(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
        type: 0,
        _id: imageId.toString(),
        user: `${anotherUserId.toString()},${anotherUser2Id.toString()},${userInfo._id.toString()}`
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function(err) {
        if(err) return done(err)
        done()
      })
    })

  })

  describe(`post the media white_list fail test -> ${COMMON_API}`, function() {

    before(function(done) {
      ImageModel.updateOne({
        _id: imageId
      }, {
        $set: [ userInfo._id ]
      })
      .then(_ => {
        done()
      })
      .catch(err => {
        console.log('oops: ', err)
        done(err)
      })
    })

    it(`post the media white_list fail because the userid is not valid`, function(done) {
      Request
      .post(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
        type: 0,
        _id: imageId.toString(),
        user: `${anotherUserId.toString().slice(1)}`
      })
      .expect(400)
      .expect('Content-Type', /json/)
      .end(function(err) {
        if(err) return done(err)
        done()
      })
    })

    it(`post the media white_list fail because lack of the userid`, function(done) {
      Request
      .post(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
        type: 0,
        _id: imageId.toString()
      })
      .expect(400)
      .expect('Content-Type', /json/)
      .end(function(err) {
        if(err) return done(err)
        done()
      })
    })

    it(`post the media white_list fail because lack of the type`, function(done) {
      Request
      .post(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
        _id: imageId.toString(),
        user: `${anotherUserId.toString()},${anotherUser2Id.toString()},${userInfo._id.toString()}`
      })
      .expect(400)
      .expect('Content-Type', /json/)
      .end(function(err) {
        if(err) return done(err)
        done()
      })
    })

    it(`post the media white_list fail because lack of the _id`, function(done) {
      Request
      .post(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
        type: 0,
        user: `${anotherUserId.toString()},${anotherUser2Id.toString()},${userInfo._id.toString()}`
      })
      .expect(400)
      .expect('Content-Type', /json/)
      .end(function(err) {
        if(err) return done(err)
        done()
      })
    })

    it(`post the media white_list fail because the type is not valid`, function(done) {
      Request
      .post(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
        type: 3,
        _id: imageId.toString(),
        user: `${anotherUserId.toString()},${anotherUser2Id.toString()},${userInfo._id.toString()}`
      })
      .expect(400)
      .expect('Content-Type', /json/)
      .end(function(err) {
        if(err) return done(err)
        done()
      })
    })

    it(`post the media white_list fail because the _id is not valid`, function(done) {
      Request
      .post(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
        type: 0,
        _id: imageId.toString().slice(1),
        user: `${anotherUserId.toString()},${anotherUser2Id.toString()},${userInfo._id.toString()}`
      })
      .expect(400)
      .expect('Content-Type', /json/)
      .end(function(err) {
        if(err) return done(err)
        done()
      })
    })

    // it(`post the media white_list fail because the _id is not found`, function(done) {
    //   const id = imageId.toString()
    //   Request
    //   .post(COMMON_API)
    //   .set({
    //     Accept: 'application/json',
    //     Authorization: `Basic ${selfToken}`
    //   })
    //   .query({
    //     type: 0,
    //     _id: `${Math.floor((id.slice(0, 1) + 3) % 10)}${id.slice(1)}`,
    //     user: `${anotherUserId.toString()},${anotherUser2Id.toString()},${userInfo._id.toString()}`
    //   })
    //   .expect(404)
    //   .expect('Content-Type', /json/)
    //   .end(function(err) {
    //     if(err) return done(err)
    //     done()
    //   })
    // })

  })
  
  describe(`delete the media white_list user success test -> ${COMMON_API}`, function() {

    before(function(done) {
      ImageModel.updateOne({
        _id: imageId
      }, {
        $set: [ userInfo._id, anotherUserId, anotherUser2Id ]
      })
      .then(_ => {
        done()
      })
      .catch(err => {
        console.log('oops: ', err)
        done(err)
      })
    })

    after(function(done) {
      ImageModel.findOne({
        _id: imageId
      })
      .select({
        white_list: 1
      })
      .exec()
      .then(data => {
        expect(data._doc.white_list.length).to.be.eq(1)
        done()
      })
      .catch(err => {
        console.log('oops: ', err)
        done(err)
      })
    })

    it(`delete the media white_list user`, function(done) {

      Request
      .delete(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
        type: 0,
        _id: imageId.toString(),
        users: `${anotherUserId.toString()},${anotherUser2Id.toString()}`
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function(err) {
        if(err) return done(err)
        done()
      })

    })

  })

  describe(`delete the media white_list user fail test -> ${COMMON_API}`, function() {

    before(function(done) {
      ImageModel.updateOne({
        _id: imageId
      }, {
        $set: {
          white_list: [userInfo._id, anotherUserId, anotherUser2Id]
        }
      })
      .then(_ => {
        done()
      })
      .catch(err => {
        console.log('oops: ', err)
      })
    })

    it(`delete the media white_list user fail because lack of the type params`, function(done) {

      Request
      .delete(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
        _id: imageId.toString(),
        users: `${anotherUserId.toString()},${anotherUser2Id.toString()}`
      })
      .expect(400)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        done()
      })

    })

    it(`delete the media white_list user fail because the type params is not valid`, function(done) {

      Request
      .delete(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
        type: 3,
        _id: imageId.toString(),
        users: `${anotherUserId.toString()},${anotherUser2Id.toString()}`
      })
      .expect(400)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        done()
      })

    })

    it(`delete the media white_list user fail because the users is not valid`, function(done) {

      Request
      .delete(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
        type: 0,
        _id: imageId.toString(),
        users: `${anotherUserId.toString()},${anotherUser2Id.toString().slice(1)}`
      })
      .expect(400)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        done()
      })

    })

    it(`delete the media white_list user fail because lack of the users params`, function(done) {

      Request
      .delete(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
        type: 0,
        _id: imageId.toString(),
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