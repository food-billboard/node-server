require('module-alias/register')
const { omit } = require('lodash')
const { UserModel, ImageModel, encoded, ROLES_NAME_MAP } = require('@src/utils')
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
      // let newAvatar = ObjectId('571094e2976aeb1df982ad4e')
      const newMobile = 18368003193
      const newEmail = '18368003192@163.com'
      const newPassword = 'woshixiaoguiasd'

      after(function(done) {
        UserModel.findOne({
          _id: userInfo._id
        })
        .select({
          username: 1,
          avatar: 1,
          description: 1,
          mobile: 1,
          password: 1,
          email: 1
        })
        .exec()
        .then(data => {
          const { _doc: { username, avatar, description, email, mobile, password } } = data
          expect(username).to.be.equals(newUserName)
          expect(avatar._id.toString() == (newAvatar.toString())).to.be.true
          expect(description).to.be.equals(newDescription)
          expect(email === newEmail).to.be.true
          expect(mobile == newMobile).to.be.true
          expect(password == encoded(newPassword)).to.be.true
          done()
        })
        .catch(err => {
          console.log('oops: ', err)
          done(err)
        })
      })

      it(`put the admin info success`, function(done) {

        const newInfo = {
          username: newUserName,
          avatar: newAvatar.toString(),
          description: newDescription,
          mobile: newMobile,
          email: newEmail,
          password: newPassword
        }

        Request
        .put(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .send(newInfo)
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

    describe(`get the admin info fail -> ${COMMON_API}`, function() {

      it(`get the admin info fail because the user auth is lower than sub_development`, function(done) {

        UserModel.updateOne({
          _id: userInfo._id 
        }, {
          $set: {
            roles: [
              ROLES_NAME_MAP.CUSTOMER
            ]
          }
        })
        .then(_ => {
          return Request
          .get(COMMON_API)
          .set({
            Accept: 'application/json',
            Authorization: `Basic ${selfToken}`
          })
          .expect(403)
          .expect('Content-Type', /json/)
        })
        .then(_ => {
          return UserModel.updateOne({
            _id: userInfo._id 
          }, {
            $set: {
              roles: userInfo.roles 
            }
          })
        })
        .then(function() {
          done()
        })
        .catch(err => {
          done(err)
        })

      })

    })
    
    describe(`put the admin info fail -> ${COMMON_API}`, function() {

      let newUserName = COMMON_API.slice(0, -1)
      let newAvatar = ObjectId('571094e2976aeb1df982ad4e')
      let newDescription = COMMON_API
      const newMobile = 18368003193
      const newEmail = '18368003192@163.com'
      const newPassword = 'woshixiaoguiasd'

      const newInfo = {
        username: newUserName,
        avatar: newAvatar.toString(),
        description: newDescription,
        mobile: newMobile,
        email: newEmail,
        password: newPassword
      }

      it(`put the admin info fail because the username's length is to long`, function(done) {

        Request
        .put(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .send({
          ...omit(newInfo),
          username: newUserName.repeat(10),
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
          ...newInfo,
          username: '',
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
          ...newInfo,
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
          ...newInfo,
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
          ...newInfo,
          avatar: newAvatar.toString().slice(1),
        })
        .expect(400)
        .expect('Content-Type', /json/)
        .end(function(err) {
          if(err) return done(err)
          done()
        })

      })

      it(`put the admin info fail because the mobile is not verify`, function(done) {
        
        Request
        .put(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .send({
          ...newInfo,
          mobile: 1122333
        })
        .expect(400)
        .expect('Content-Type', /json/)
        .end(function(err) {
          if(err) return done(err)
          done()
        })

      })

      it(`put the admin info fail because the email is not verify`, function(done) {
        
        Request
        .put(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .send({
          ...newInfo,
          email: '222'
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