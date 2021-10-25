require('module-alias/register')
const { expect } = require('chai')
const { Types: { ObjectId } } = require('mongoose')
const { mockCreateUser, Request, commonValidate, mockCreateImage, createMobile } = require('@test/utils')
const { getToken, UserModel, dealRedis, ImageModel, MemberModel, ROLES_NAME_MAP, FriendsModel } = require('@src/utils')
const { email_type } = require('@src/router/user/logon/map')

const COMMON_API = '/api/user/logon/register'

function responseExpect(res, validate=[]) {

  const { res: { data: target } } = res

  expect(target).to.be.a('object').and.that.includes.all.keys('attentions', 'avatar', 'createdAt', 'fans', 'hot', 'updatedAt', 'token', 'username', '_id')
  commonValidate.number(target.attentions)
  commonValidate.poster(target.avatar)
  commonValidate.date(target.createdAt)
  commonValidate.number(target.fans)
  commonValidate.number(target.hot)
  commonValidate.date(target.updatedAt)
  expect(target.token).to.be.satisfies(function(target) {
    return !!getToken(target)[1]
  })
  commonValidate.string(target.username)
  expect(target.username).to.be.equal(COMMON_API)
  commonValidate.objectId(target._id)

  if(Array.isArray(validate)) {
    validate.forEach(valid => {
      typeof valid == 'function' && valid(target)
    })
  }else if(typeof validate == 'function') {
    validate(target)
  }
}

describe(`${COMMON_API} test`, function() {

  describe(`post the info for register and verify test -> ${COMMON_API}`, function() {

    let avatar

    before(function(done) {
      const { model } = mockCreateImage({
        src: COMMON_API
      })

      model.save()
      .then(data => {
        avatar = data._id
        done()
      })
      .catch(err => {
        console.log('oops: ', err)
        done(err)
      })
      
    })

    after(function(done) {
      ImageModel.deleteMany({
        src: COMMON_API
      })
      .then(_ => {
        done()
      })
      .catch(err => {
        console.log('oops: ', err)
        done(err)
      })
    })
    
    describe(`post the info for register and verify success test -> ${COMMON_API}`, function() {

      let mobile = createMobile()
      let email = `${mobile}@qq.com`
      let captcha = '123456'
      let description = COMMON_API
      let username = COMMON_API
      let userId 

      let redisKey = `${email}-${email_type[1]}`

      before(function(done) {
        dealRedis(function(redis) {
          redis.set(redisKey, captcha)
        })
        .then(function() {
          done()
        })
        .catch(err => {
          console.log('oops: ', err)
        })
      })

      after(function(done) {
        Promise.all([
          UserModel.deleteOne({
            mobile
          }),
          dealRedis(function(redis) {
            redis.del(redisKey)
          }),
          MemberModel.findOneAndDelete({
            user: userId
          })
          .select({
            _id: 1
          })
          .exec(),
          FriendsModel.deleteOne({
            user: userId
          })
        ])
        .then(function([,,data]) {
          expect(!!data._id).to.be.true
          done()
        })
        .catch(err => {
          console.log('oops: ', err)
        })
      })

      it(`post the info for register and verify success`, function(done) {

        Request
        .post(COMMON_API)
        .send({
          mobile,
          password: '1234567890',
          email,
          captcha,
          username,
          description,
          avatar: avatar.toString()
        })
        .set({ Accept: 'Application/json' })
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
            userId = ObjectId(target._id) 
          })
          done()
        })

      })

    })

    describe(`post the info for register and register some role`, function() {

      let mobile = createMobile()
      let email = `${mobile}@qq.com`
      let captcha = '123456'
      let description = COMMON_API
      let username = `${COMMON_API}\/90980`

      let redisKey = `${email}-${email_type[1]}`

      let userId 

      before(function(done) {
        dealRedis(function(redis) {
          redis.set(redisKey, captcha)
        })
        .then(function() {
          done()
        })
        .catch(err => {
          console.log('oops: ', err)
        })
      })

      after(function(done) {
        Promise.all([
          UserModel.findOne({
            mobile,
            roles: {
              $in: [
                ROLES_NAME_MAP.CUSTOMER
              ]
            }
          }),
          dealRedis(function(redis) {
            redis.del(redisKey)
          }),
          MemberModel.deleteOne({
            user: userId
          }),
          FriendsModel.deleteOne({
            user: userId
          })
        ])
        .then(([data]) => {
          expect(!!data).to.be.true
          return UserModel.deleteOne({
            mobile
          })
        })
        .then(function() {
          done()
        })
        .catch(err => {
          done(err)
        })
      })

      it(`post the info for register and verify success and try to register SUPER_ADMIN role`, function(done) {
        Request
        .post(COMMON_API)
        .send({
          mobile,
          password: '1234567890',
          email,
          captcha,
          username,
          description,
          avatar: avatar.toString()
        })
        .set({ Accept: 'Application/json' })
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
            userId = target._id 
          })
          done()
        })
      })

    }) 

    describe(`post the info for register and verify fail test -> ${COMMON_API}`, function() {

      let another
      let result
      let captcha = '123456'
      let email = `15895336842@163.com`
      let redisKey = `${email}-${email_type[1]}`

      before(function(done) {
        const { model, ...nextData } = mockCreateUser({
          username: COMMON_API,
          email
        })
        another = nextData

        model.save()
        .then(function(data) {
          result = data
          dealRedis(function(redis) {
            redis.set(redisKey, captcha, 'EX', 10)
          })
          done()
        })
        .catch(err => {
          console.log('oops: ', err)
        })
      })

      after(function(done) {
        Promise.all([
          UserModel.deleteOne({
            username: COMMON_API
          })
        ])
        .then(function() {
          done()
        })
        .catch(err => {
          console.log('oops: ', err)
        })
      })

      it(`post the info for register and verify fail because the mobile is exists`, function(done) {

        Request
        .post(COMMON_API)
        .send({
          mobile: result.mobile,
          password: '1234567890',
          email: result.email,
          captcha
        })
        .set({ Accept: 'Application/json' })
        .expect(403)
        .expect('Content-Type', /json/)
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

      it(`post the info for register and verify fail because the mobile is not verify`, function(done) {

        Request
        .post(COMMON_API)
        .send({
          mobile: parseInt(result.mobile.toString().slice(1)),
          passwrd: '1234567890',
          email: result.email,
          captcha
        })
        .set({ Accept: 'Application/json' })
        .expect(400)
        .expect('Content-Type', /json/)
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

      it(`post the info for register and verify fail because the password is not verify`, function(done) {

        Request
        .post(COMMON_API)
        .send({
          mobile: result.mobile,
          passwrd: null,
          email: result.email,
          captcha
        })
        .set({ Accept: 'Application/json' })
        .expect(400)
        .expect('Content-Type', /json/)
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

      it(`post the info for register and verify fail because the email is not verify`, function(done) {

        Request
        .post(COMMON_API)
        .send({
          mobile: result.email,
          passwrd: '1234567890',
          email: COMMON_API,
          captcha
        })
        .set({ Accept: 'Application/json' })
        .expect(400)
        .expect('Content-Type', /json/)
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

      it(`post the info for register and verify fail because the captcha is not verify`, function(done) {

        Request
        .post(COMMON_API)
        .send({
          mobile: result.captcha,
          passwrd: '1234567890',
          email: result.email,
          captcha: ''
        })
        .set({ Accept: 'Application/json' })
        .expect(400)
        .expect('Content-Type', /json/)
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

      it(`post the info for register and verify fail because lack the params of mobile`, function(done) {

        Request
        .post(COMMON_API)
        .send({
          passwrd: '1234567890',
          email: result.email,
          captcha
        })
        .set({ Accept: 'Application/json' })
        .expect(400)
        .expect('Content-Type', /json/)
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

      it(`post the info for register and verify fail because lack the params of password`, function(done) {
        
        Request
        .post(COMMON_API)
        .send({
          mobile: result.mobile,
          email: result.email,
          captcha
        })
        .set({ Accept: 'Application/json' })
        .expect(400)
        .expect('Content-Type', /json/)
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

      it(`post the info for register and verify fail because lack the params of email`, function(done) {
        
        Request
        .post(COMMON_API)
        .send({
          mobile: result.mobile,
          passwrd: '1234567890',
          captcha
        })
        .set({ Accept: 'Application/json' })
        .expect(400)
        .expect('Content-Type', /json/)
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

      it(`post the info for register and verify fail because lack the params of captcha`, function(done) {
        
        Request
        .post(COMMON_API)
        .send({
          mobile: result.mobile,
          passwrd: '1234567890',
          email: result.email,
        })
        .set({ Accept: 'Application/json' })
        .expect(400)
        .expect('Content-Type', /json/)
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

      it(`post the info for register and verify fail because the captcha is overday`, async function() {
        
        let res = true

        await dealRedis(function(redis) {
          redis.del(redisKey)
        })
        .catch(function(err) {
          console.log('oops: ', err)
          res = false
        })

        await Request
        .post(COMMON_API)
        .send({
          mobile: result.mobile,
          passwrd: '1234567890',
          email: result.email,
        })
        .set({ Accept: 'Application/json' })
        .expect(400)
        .expect('Content-Type', /json/)

        return res ? Promise.resolve() : Promise.reject(COMMON_API)

      })

    })

  })

})