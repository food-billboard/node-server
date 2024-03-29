require('module-alias/register')
const { expect } = require('chai')
const { mockCreateUser, Request, createEtag, commonValidate } = require('@test/utils')
const { UserModel } = require('@src/utils')
const Day = require('dayjs')

const COMMON_API = '/api/customer/manage/attention'

function responseExpect(res, validate=[]) {

  const { res: { data: target } } = res

  expect(target).to.be.a('object').and.that.includes.all.keys('attentions')
  target.attentions.forEach(item => {
    expect(item).to.be.a('object').and.that.includes.all.keys('avatar', 'username', '_id', 'description')
    commonValidate.poster(item.avatar)
    commonValidate.string(item.username)
    commonValidate.string(item.description)
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
  let updatedAt
  let userId

  before(async function() {

    const { model:user } = mockCreateUser({
      username: COMMON_API,
      mobile: 15874996521
    })
  
    const { model: self, signToken } = mockCreateUser({
      username: COMMON_API,
      mobile: 15789665412
    })

    await Promise.all([
      self.save(),
      user.save()
    ])
    .then(([self, user]) => {
      userId = user._id
      result = self
      selfToken = signToken(self._id)
      return Promise.all([
        UserModel.updateOne({
          mobile: 15789665412,
          username: COMMON_API,
        }, {
          $set: {
            attentions: [ { _id: userId, timestamps: Date.now() } ]
          }
        }),
        UserModel.updateOne({
          username: COMMON_API,
          mobile: 15874996521
        }, {
          $set: {
            fans: [ { _id: result._id, timestamps: Date.now() } ]
          }
        })
      ])
    })
    .catch(err => {
      console.log('oops: ', err)
    })

    return Promise.resolve()

  })

  after(async function() {

    await UserModel.deleteMany({
      username: COMMON_API
    })
    .catch(err => {
      console.log('oops: ', err)
    })

    return Promise.resolve()

  })

  describe(`pre check the params test -> ${COMMON_API}`, function() {

    describe(`pre check params fail test -> ${COMMON_API}`, function() {

      it(`pre check params fail becasue of the movie id is not verify`, function(done) {

        Request
        .put(COMMON_API)
        .send({
          _id: userId.toString().slice(1)
        })
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(400)
        .expect('Content-Type', /json/)
        .end(function(err) {
          if(err) return done(err)
          done()
        })

      })

      it(`pre check params fail becasue lack of the movie id`, function(done) {

        Request
        .delete(COMMON_API)
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(400)
        .expect('Content-Type', /json/)
        .end(function(err) {
          if(err) return done(err)
          done()
        })

      })

      it(`pre check params fail because of the movie id is not found in database`, function(done) {

        const id = userId.toString()

        Request
        .put(COMMON_API)
        .send({
          _id: `${(parseInt(id.slice(0, 1)) + 5) % 10}${id.slice(1)}`
        })
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(404)
        .expect('Content-Type', /json/)
        .end(function(err) {
          if(err) return done(err)
          done()
        })

      })

    })

  })

  describe(`get self attention list -> ${COMMON_API}`, function() {

    describe(`get self attentions list success test -> ${COMMON_API}`, function() {

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
      
      it(`get self attentions list success`, function(done) {

        Request
        .get(COMMON_API)
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

      it.skip(`get self attentions list success and return the status of 304`, function(done) {

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

      it.skip(`get self attentions list success and hope return the status of 304 but the content has edited`, function(done) {


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

      it.skip(`get self attentions list success and hope return the status of 304 but the params of query is change`, function(done) {

        const query = {
          pageSize: 10
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

  })

  describe(`put the new user for attention -> ${COMMON_API}`, function() {

    describe(`put the new user for attention success test -> ${COMMON_API}`, function() {

      before(function(done) {
        UserModel.updateMany({
          username: COMMON_API
        }, {
          $set: {
            fans: [],
            attentions: []
          }
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
            _id: result._id,
            "attentions._id": { $in: [ userId ] }
          })
          .select({
            _id: 0,
            attentions: 1
          })
          .exec(),
          UserModel.findOne({
            _id: userId,
            "fans._id": { $in: [ result._id ] }
          })
          .select({
            _id: 0,
            fans: 1
          })
          .exec(),
        ])
        .then(([self, user]) => {
          return !!self && !!user
        })
        .then(result => {
          if(result) return done()
          done(new Error(COMMON_API))
        })
      })

      it(`put the new user for attention success`, function(done) {

        Request
        .put(COMMON_API)
        .send({
          _id: userId
        })
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err) {
          if(err) return done(err)
          done()
        })

      })

    })

    describe(`put the new user for attention success but not write success test -> ${COMMON_API}`, function() {

      before(function(done) {
        UserModel.updateMany({
          username: COMMON_API
        }, {
          $set: {
            fans: [ { _id: result._id } ],
            attentions: [ { _id: userId } ]
          }
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
            _id: result._id,
            "attentions._id": { $in: [ userId ] }
          })
          .select({
            _id: 0,
            attentions: 1
          })
          .exec(),
          UserModel.findOne({
            _id: userId,
            "fans._id": { $in: [ result._id ] }
          })
          .select({
            _id: 0,
            fans: 1
          })
          .exec(),
        ])
        .then(([self, user]) => {
          return !!self && self.attentions.length == 1 && !!user && user.fans.length == 1
        })
        .then(result => {
          if(result) return done()
          done(new Error(COMMON_API))
        })
      })

      it(`put the new user for attentions fail but the user is attentioned`, function(done) {

        Request
        .put(COMMON_API)
        .send({
          _id: userId.toString()
        })
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(404)
        .expect('Content-Type', /json/)
        .end(function(err) {
          if(err) return done(err)
          done()
        })

      })

    })

  })

  describe(`cancel the user attention -> ${COMMON_API}`, function() {

    describe(`cancel the new user for attention success test -> ${COMMON_API}`, function() {

      before(function(done) {
        UserModel.updateMany({
          username: COMMON_API
        }, {
          $set: {
            fans: [ { _id: result._id } ],
            attentions: [ { _id: userId } ]
          }
        })
        .then(function() {
          done()
        })
        .catch(err => {
          console.log('oops: ', err)
        })
      })

      after(async function() {
        const res = await Promise.all([
          UserModel.findOne({
            _id: result._id,
            attentions: []
          })
          .select({
            _id: 1
          })
          .exec(),
          UserModel.findOne({
            _id: userId,
            fans: []
          })
          .select({
            _id: 1
          })
          .exec(),
        ])
        .then(([self, user]) => {
          return !!self && !!user
        })
        .catch(err => {
          console.log('oops: ', err)
          return false
        })

        return res ? Promise.resolve() : Promise.reject(COMMON_API)

      })

      it(`cancel the new user for attention success`, function(done) {

        Request
        .delete(COMMON_API)
        .query({
          _id: userId.toString()
        })
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err) {
          if(err) return done(err)
          done()
        })

      })

    })

    describe(`cancel the new user for attention success but not write database test -> ${COMMON_API}`, function() {

      before(function(done) {
        UserModel.updateMany({
          username: COMMON_API
        }, {
          $set: {
            fans: [],
            attentions: []
          }
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
            _id: result._id,
            attentions: []
          })
          .select({
            _id: 0,
            attentions: 1
          })
          .exec(),
          UserModel.findOne({
            _id: userId,
            fans: []
          })
          .select({
            _id: 0,
            fans: 1
          })
          .exec(),
        ])
        .then(([self, user]) => {
          return !!self && !!user
        })
        .then(result => {
          if(result) return done()
          done(new Error(COMMON_API))
        })
      })

      it(`cancel the new user for attentions fail because the user is not attentioned`, function(done) {
        
        Request
        .delete(COMMON_API)
        .query({
          _id: userId.toString()
        })
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(404)
        .expect('Content-Type', /json/)
        .end(function(err) {
          if(err) return done(err)
          done()
        })

      })

    })

  })

})