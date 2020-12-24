require('module-alias/register')
const { UserModel, ImageModel } = require('@src/utils')
const { expect } = require('chai')
const { Request, commonValidate, mockCreateUser, mockCreateImage } = require('@test/utils')
const { Types: { ObjectId } } = require("mongoose")

const COMMON_API = '/api/manage/admin'

function responseExpect(res, validate=[]) {
  const { res: { data: target } } = res

  expect(target).to.be.a('object').and.that.include.all.keys('username', 'avatar', 'hot', 'fans', 'attentions', 'createdAt', 'updatedAt', '_id')

  commonValidate.string(target.username)
  commonValidate.poster(target.avatar)
  commonValidate.number(target.hot)
  commonValidate.number(target.fans)
  commonValidate.number(target.attentions)
  commonValidate.date(target.createdAt)
  commonValidate.date(target.updatedAt)
  commonValidate.objectId(target._id)

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
  let newAvatar

  before(function(done) {
    const { model, signToken } = mockCreateUser({
      username: COMMON_API
    })
    const { model: image } = mockCreateImage({
      src: COMMON_API
    })

    Promise.all([
      model.save(),
      image.save()
    ])
    .then(([data, image]) => {
      selfToken = signToken(data._id)
      userInfo = data
      newAvatar = image._id
      done()
    })
    .catch(err => {
      console.log('oops: ', err)
    })
  })

  after(function(done) {

    Promise.all([
      ImageModel.deleteMany({
        src: COMMON_API
      }),
      UserModel.deleteMany({
        _id: userInfo._id
      })
    ])
    .then(data => {
      done()
    })
    .catch(err => {
      console.log('oops: ', err)
    }) 

  })

  describe(`${COMMON_API} success test`, function() {

    describe(`get the admin info success -> ${COMMON_API}`, function() {

      it(`get the admin info success`, function(done) {

        Request
        .get(COMMON_API)
        .set({
          Accept: 'application/json',
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
          responseExpect(obj)
          done()
        })

      })

    })

    describe(`put the admin info success -> ${COMMON_API}`, function() {

      let newUserName = COMMON_API.slice(0, -1)
      let newDescription = COMMON_API.slice(0, -1)

      after(function(done) {
        UserModel.findOne({
          _id: userInfo._id
        })
        .select({
          username: 1,
          avatar: 1,
          description: 1
        })
        .exec()
        .then(data => {
          const { _doc: { username, avatar, description } } = data
          expect(username).to.be.equals(newUserName)
          expect(avatar.src == (COMMON_API)).to.be.true
          expect(description).to.be.equals(newDescription)
          done()
        })
        .catch(err => {
          console.log('oops: ', err)
        })
      })

      it(`put the admin info success`, function(done) {

        Request
        .put(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .send({
          username: newUserName,
          avatar: newAvatar.toString(),
          description: newDescription
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err) {
          if(err) return done(err)
          done()
        })

      })

    })

  })

  describe(`${COMMON_API} fail test`, function() {
    
    describe(`put theadmin info fail -> ${COMMON_API}`, function() {

      let newUserName = COMMON_API.slice(0, -1)
      let newAvatar = ObjectId('571094e2976aeb1df982ad4e')
      let newDescription = COMMON_API

      it(`put the admin info fail because the username's length is to long`, function(done) {

        Request
        .put(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .send({
          username: newUserName.repeat(10),
          avatar: newAvatar.toString(),
          description: newDescription
        })
        .expect(400)
        .expect('Content-Type', /json/)
        .end(function(err) {
          if(err) return done(err)
          done()
        })

      })

      it(`put the admin info fail because the username's length is to short`, function(done) {

        Request
        .put(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .send({
          username: '',
          avatar: newAvatar.toString(),
          description: newDescription
        })
        .expect(400)
        .expect('Content-Type', /json/)
        .end(function(err) {
          if(err) return done(err)
          done()
        })

      })

      it(`put the admin info fail because the description's length is to long`, function(done) {

        Request
        .put(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .send({
          username: newUserName,
          avatar: newAvatar.toString(),
          description: newDescription.repeat(10)
        })
        .expect(400)
        .expect('Content-Type', /json/)
        .end(function(err) {
          if(err) return done(err)
          done()
        })

      })

      it(`put the admin info fail because the description's length is to short`, function(done) {

        Request
        .put(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .send({
          username: newUserName,
          avatar: newAvatar.toString(),
          description: ''
        })
        .expect(400)
        .expect('Content-Type', /json/)
        .end(function(err) {
          if(err) return done(err)
          done()
        })

      })

      it(`put the admin info fail because the avatar is not verify`, function(done) {
        
        Request
        .put(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .send({
          username: newUserName,
          avatar: newAvatar.toString().slice(1),
          description: newDescription
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

})