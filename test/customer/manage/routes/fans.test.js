require('module-alias/register')
const { expect } = require('chai')
const { mockCreateUser, Request, createEtag, commonValidate } = require('@test/utils')
const { UserModel } = require('@src/utils')
const Day = require('dayjs')

const COMMON_API = '/api/customer/manage/fans'

function responseExpect(res, validate=[]) {

  const { res: { data: target } } = res

  expect(target).to.be.a('object').and.that.includes.all.keys('fans')
  target.fans.forEach(item => {
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

  let result
  let selfToken
  let userId

  before(async function() {

    const { model:user } = mockCreateUser({
      username: COMMON_API,
      mobile: 15874996521
    })
  
    const { model: self, token } = mockCreateUser({
      username: COMMON_API,
      mobile: 15789665412
    })

    selfToken = token

    await Promise.all([
      self.save(),
      user.save()
    ])
    .then(([self, user]) => {
      userId = user._id
      result = self
      return Promise.all([
        UserModel.updateOne({
          mobile: 15789665412,
          username: COMMON_API,
        }, {
          fans: [ { _id: userId } ]
        }),
        UserModel.updateOne({
          username: COMMON_API,
          mobile: 15874996521
        }, {
          attentions: [ { _id: result._id } ]
        })
      ])
    })
    .catch(err => {
      console.log('oops: ', err)
    })

    return Promise.resolve()

  })

  after(async function() {

    UserModel.deleteMany({
      username: COMMON_API
    })
    .catch(err => {
      console.log('oops: ', err)
    })

    return Promise.resolve()

  })

  describe(`get self fans list success test -> ${COMMON_API}`, function() {


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

    it(`get self fans list success `, function(done) {

      Request
      .get(COMMON_API)
      .send({
        _id: userId.toString()
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
        Authorization: `Basic ${selfToken}`,
        'If-Modified-Since': updatedAt,
        'If-None-Match': createEtag({}),
      })
      .expect(304)
      .expect('Last-Modified', updatedAt.toString())
      .expect('ETag', createEtag({}))
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

    it(`get self fans list success and hope return the status of 304 but the params of query is change`, function(done) {

      const query = {
        pageSize: 10
      }

      Request
      .get(COMMON_API)
      .query(query)
      .set({
        Accept: 'Application/json',
        'If-Modified-Since': updatedAt,
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

})