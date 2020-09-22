require('module-alias/register')
const { expect } = require('chai')
const { mockCreateUser, Request, commonValidate } = require('@test/utils')
const { getToken } = require('@src/utils')

const COMMON_API = '/api/user/logon/account'

function responseExpect(res, validate=[]) {

  const { res: { data: target } } = res

  expect(target).to.be.a('object').and.that.includes.all.keys('attentions', 'avatar', 'createdAt', 'fans', 'hot', 'updatedAt', 'token', 'username', '_id', 'allow_many')
  commonValidate.number(target.attentions)
  commonValidate.poster(target.avatar)
  commonValidate.date(target.createdAt)
  commonValidate.number(target.fans)
  commonValidate.number(target.hot)
  commonValidate.date(target.updatedAt)
  expect(target.token).to.be.satisfies(function(target) {
    console.log(getToken(target)[0])
    return !!!getToken(target)[0]
  })
  commonValidate.string(target.username)
  commonValidate.objectId(target._id)
  expect(target.allow_many).to.be.a('boolean')

  if(Array.isArray(validate)) {
    validate.forEach(valid => {
      typeof valid == 'function' && valid(target)
    })
  }else if(typeof validate == 'function') {
    validate(target)
  }
}

describe(`${COMMON_API} test`, function() {

  describe(`post the userinfo for logon test -> ${COMMON_API}`, function() {

    let database
    let another
    let result

    before(function(done) {
      const { model, ...nextData } = mockCreateUser({
        username: COMMON_API
      })
      another = nextData
      database = model
      database.save()
      .then(function(data) {
        result = data
        done()
      })
      .catch(err => {
        console.log('oops: ', err)
      })
    })

    after(function(done) {
      database.deleteOne({
        username: COMMON_API
      })
      .then(function() {
        done()
      })
      .catch(err => {
        console.log('oops: ', err)
      })
    })

    describe(`post the userinfo for logon success test -> ${COMMON_API}`, function() {

      it(`post the userinfo for logon success`, function(done) {

        Request
        .post(COMMON_API)
        .send({
          mobile: result.mobile,
          password: another.decodePassword
        })
        .set('Accept', 'Application/json')
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

    describe(`post the userinfo for logon fail test -> ${COMMON_API}`, function() {

      it(`post the userinfo for logon fail because the params of mobile is not found`, function(done) {

        const mobile = result.mobile.toString()

        Request
        .post(COMMON_API)
        .send({
          mobile: parseInt(`${mobile.slice(0, -1)}${(mobile.slice(-1) + 5) % 10}`),
          password: another.decodePassword
        })
        .set('Accept', 'Application/json')
        .expect(403)
        .expect('Content-Type', /json/)
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

      it(`post the userinfo for logon fail because the params of mobile is not verify`, function(done) {

        Request
        .post(COMMON_API)
        .send({
          mobile: parseInt(result.mobile.toString().slice(1)),
          password: another.decodePassword
        })
        .set('Accept', 'Application/json')
        .expect(400)
        .expect('Content-Type', /json/)
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })
      
      it(`post the userinfo for logon fail becuase the params of password is not verify`, function(done) {

        Request
        .post(COMMON_API)
        .send({
          mobile: result.mobile,
          password: null
        })
        .set('Accept', 'Application/json')
        .expect(400)
        .expect('Content-Type', /json/)
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

      it(`post the userinfo for logon fail becuase the params of password is not found`, function(done) {

        const password = another.decodePassword

        Request
        .post(COMMON_API)
        .send({
          mobile: result.mobile,
          password: `${password}0`
        })
        .set('Accept', 'Application/json')
        .expect(403)
        .expect('Content-Type', /json/)
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

    })

  })

})