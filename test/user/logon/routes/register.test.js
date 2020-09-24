require('module-alias/register')
const { expect } = require('chai')
const { mockCreateUser, Request, commonValidate } = require('@test/utils')
const { getToken, UserModel } = require('@src/utils')

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
    
    describe(`post the info for register and verify success test -> ${COMMON_API}`, function() {

      let mobile = 18368003190

      after(function(done) {
        UserModel.deleteOne({
          mobile
        })
        .then(function() {
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
          password: '1234567890'
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
          responseExpect(obj)
          done()
        })

      })

    })

    describe(`post the info for register and verify fail test -> ${COMMON_API}`, function() {

      let another
      let result

      before(function(done) {
        const { model, ...nextData } = mockCreateUser({
          username: COMMON_API
        })
        another = nextData

        model.save()
        .then(function(data) {
          result = data
          done()
        })
        .catch(err => {
          console.log('oops: ', err)
        })
      })

      after(function(done) {
        UserModel.deleteOne({
          username: COMMON_API
        })
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
          password: '1234567890'
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
          passwrd: '1234567890'
        })
        .set({ Accept: 'Application/json' })
        .expect(400)
        .expect('Content-Type', /json/)
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

      it(`post the info for register and verify fail becuase the password is not verify`, function(done) {

        Request
        .post(COMMON_API)
        .send({
          mobile: result.mobile,
          passwrd: null
        })
        .set({ Accept: 'Application/json' })
        .expect(400)
        .expect('Content-Type', /json/)
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

      it(`post the info for register and verify fail becuase lack the params of mobile`, function(done) {

        Request
        .post(COMMON_API)
        .send({
          passwrd: '1234567890'
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
        })
        .set({ Accept: 'Application/json' })
        .expect(400)
        .expect('Content-Type', /json/)
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

    })

  })

})