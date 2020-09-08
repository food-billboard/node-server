require('module-alias/register')
const { expect } = require('chai')
const { mockCreateUser, Request, createEtag, commonValidate } = require('@test/utils')
const { UserModel } = require('@src/utils')

const COMMON_API = '/api/customer/manage/fans'

function responseExpect(res, validate=[]) {

  const { res: { data: target } } = res

  expect(target).to.be.a('object').and.that.includes.all.keys('attentions')
  target.attentions.forEach(item => {
    expect(item).to.be.a('object').and.that.includes.all.keys('avatar', 'username', '_id')
    commonValidate.poster(item.avatar)
    commonValidate.string(item.username)
    commonValidate.objectId(item._id)
  })

  if(Array.isArray(validate)) {
    validate.forEach(valid => {
      typeof valid == 'function' && valid(target)
    })
  }else if(typeof validate == 'function') {
    validate(target)
  }
}

describe(`${COMMON_API} test`, function() {

  let selfDatabase
  let userDatabase
  let result
  let selfToken
  let userId

  before(function(done) {

    const { model:user } = mockCreateUser({
      username: COMMON_API,
      mobile: 15874996521
    })
  
    const { model: self, token } = mockCreateUser({
      username: COMMON_API,
      mobile: 15789665412
    })

    selfDatabase = self
    userDatabase = user
    selfToken = token

    Promise.all([
      selfDatabase.save(),
      userDatabase.save()
    ])
    .then(([self, user]) => {
      userId = user._id
      result = self
      return Promise.all([
        selfDatabase.updateOne({
          mobile: 15789665412,
          username: COMMON_API,
        }, {
          fans: [ userId ]
        }),
        userDatabase.updateOne({
          username: COMMON_API,
          mobile: 15874996521
        }, {
          attentions: [ result._id ]
        })
      ])
    })
    .then(function() {
      done()
    })
    .catch(err => {
      console.log('oops: ', err)
    })

  })

  after(function(done) {

    UserModel.deleteMany({
      username: COMMON_API
    })
    .then(function() {
      done()
    })
    .catch(err => {
      console.log('oops: ', err)
    })

  })

  describe(`get self fans list success test -> ${COMMON_API}`, function() {

    it(`get self fans list success `, function(done) {

      Request
      .get(COMMON_API)
      .send({
        _id: userId.toString().slice(1)
      })
      .set({
        Accept: 'Application/json',
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

    it(`get self fans list success and return the status of 304`, function(done) {

      Request
      .get(COMMON_API)
      .set({
        Accept: 'Application/json',
        Authorization: `Basic ${selfToken}`
      })
      .expect(200)
      .expect({
        'Content-Type': /json/,
      })
      .end(function(err, _) {
        if(err) return done(err)
        done()
      })

    })

    it(`get self fans list success and hope return the status of 304 but the content has edited`, function(done) {


      Request
      .get(COMMON_API)
      .set({
        Accept: 'Application/json',
        'If-Modified-Since': new Date(Day(result.updatedAt).valueOf - 10000000),
        'If-None-Match': createEtag({}),
        Authorization: `Basic ${selfToken}`
      })
      .expect(200)
      .expect({
        'Content-Type': /json/,
        'Last-Modified': result.updatedAt,
        'ETag': createEtag({})
      })
      .end(function(err, _) {
        if(err) return done(err)
        done()
      })

    })

    it(`get self fans list success and hope return the status of 304 but the params of query is change`, function(done) {

      const query = {
        pageSize: 10
      }

      Request
      .get(COMMON_API)
      .query(query)
      .set({
        Accept: 'Application/json',
        'If-Modified-Since': new Date(Day(result.updatedAt).valueOf - 10000000),
        'If-None-Match': createEtag({}),
        Authorization: `Basic ${selfToken}`
      })
      .expect(200)
      .expect({
        'Content-Type': /json/,
        'Last-Modified': result.updatedAt,
        'ETag': createEtag(query)
      })
      .end(function(err, _) {
        if(err) return done(err)
        done()
      })

    })

  })

})