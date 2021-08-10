require('module-alias/register')
const { expect } = require('chai')
const { mockCreateUser, Request, createEtag, commonValidate } = require('@test/utils')
const { UserModel } = require('@src/utils')
const Day = require('dayjs')

const COMMON_API = '/api/customer/manage'

function responseExpect(res, validate=[]) {

  const { res: { data: target } } = res

  expect(target).to.be.a('object').and.include.all.keys('attentions', 'avatar', 'fans', 'hot', 'username', '_id', 'createdAt', 'updatedAt', 'email', 'description', "mobile")
  commonValidate.number(target.attentions)
  commonValidate.poster(target.avatar)
  commonValidate.number(target.fans)
  commonValidate.string(target.username)
  commonValidate.string(target.email)
  commonValidate.string(target.description)
  commonValidate.number(target.mobile)
  commonValidate.objectId(target._id)
  commonValidate.time(target.createdAt)
  commonValidate.time(target.updatedAt)

  if(Array.isArray(validate)) {
    validate.forEach(valid => {
      typeof valid == 'function' && valid(target)
    })
  }else if(typeof validate == 'function') {
    validate(target)
  }
}

describe(`${COMMON_API} test`, function() {

  let result
  let updatedAt
  let userId
  let selfToken
  let signToken

  before(async function() {

    const { model:self, signToken:getToken } = mockCreateUser({
      username: COMMON_API,
    })

    signToken = getToken

    await self.save()
    .then(self => {
      result = self
      userId = self._id
      selfToken = signToken(userId)
    })
    .catch(err => {
      console.log('oops: ', err)
    })

    return Promise.resolve()

  })

  after(async function() {

    await UserModel.deleteOne({
      username: COMMON_API
    })
    .catch(err => {
      console.log('oops: ', err)
    })

    return Promise.resolve()

  })

  describe(`pre check params test -> ${COMMON_API}`, function() {

    beforeEach(function(done) {
      selfToken = signToken(userId)
      done()
    })

    describe(`pre check params success test -> ${COMMON_API}`, function() {

      it(`pre check params success`, function(done) {

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

    describe(`pre check params fail test -> ${COMMON_API}`, function() {

      beforeEach(async function() {

        updatedAt = await UserModel.findOne({
          _id: userId,   
        })
        .select({
          _id: 0,
          updatedAt: 1
        })
        .exec()
        .then(data => {
          return data._doc.updatedAt
        })
        .catch(err => {
          console.log('oops: ', err)
          return false
        })

        return !!updatedAt ? Promise.resolve() : Promise.reject(COMMON_API)

      })

      it(`pre check params fail because of the token is expired`, async function() {

        await new Promise((resolve, reject) => {
          setTimeout(() => {
            resolve()
          }, 5000)
        })

        await Request
        .get(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(401)
        .expect('Content-Type', /json/)

        return Promise.resolve()

      })

      it(`pre check params fail because of the token is not verify`, function(done) {

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

      it(`pre check params fail because of the token is no found`, function(done) {

        Request
        .get(COMMON_API)
        .set({
          Accept: 'application/json',
        })
        .expect(401)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if(err) return done(err)
          done()
        })

      })

    })

  })

  describe(`get self userinfo test -> ${COMMON_API}`, function() {

    describe(`get self userinfo test success -> ${COMMON_API}`, function() {

      it.skip(`get self userinfo test success and return the status of 304`, function(done) {

        Request
        .get(COMMON_API)
        .set({
          Accept: 'Application/json',
          'If-Modified-Since': updatedAt,
          'If-None-Match': createEtag({}),
          Authorization: `Basic ${selfToken}`
        })
        .expect(304)
        .expect('Last-Modified', updatedAt.toString())
        .expect('ETag', createEtag({}))
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

      it.skip(`get self userinfo test success and hope return the status of 304 but the content has edited`, function(done) {


        Request
        .get(COMMON_API)
        .set({
          Accept: 'Application/json',
          'If-Modified-Since': new Date(Day(updatedAt).valueOf - 10000000),
          'If-None-Match': createEtag({}),
          Authorization: `Basic ${selfToken}`
        })
        .expect(200)
        .expect('Last-Modified', updatedAt.toString())
        .expect('ETag', createEtag({}))
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

      it.skip(`get self userinfo test success and hope return the status of 304 but the params of query is change`, function(done) {

        const query = {
          _id: result._id.toString()
        }

        Request
        .get(COMMON_API)
        .query(query)
        .set({
          Accept: 'Application/json',
          'If-Modified-Since': new Date(Day(updatedAt).valueOf - 10000000),
          'If-None-Match': createEtag({}),
          Authorization: `Basic ${selfToken}`
        })
        .expect(200)
        .expect('Last-Modified', updatedAt.toString())
        .expect('ETag', createEtag(query))
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

    })

    describe(`get self userinfo test fail -> ${COMMON_API}`, function() {

      beforeEach(function(done) {
        UserModel.deleteMany({
          username: COMMON_API
        })
        .then(_ => {
          done()
        })
        .catch(err => {
          console.log('oops: ', err)
        })
      })

      it(`get self userinfo fail because of the database has not the user`, function(done) {
        
        Request
        .get(COMMON_API)
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(404)
        .expect('Content-Type', /json/)
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })
      
    })

  })

})
