require('module-alias/register')
const { expect } = require('chai')
const { mockCreateUser, Request, createEtag, commonValidate } = require('@test/utils')
const { UserModel } = require('@src/utils')
const Day = require('dayjs')

const COMMON_API = '/api/customer/user'

function responseExpect(res, validate=[]) {

  const { res: { data: target } } = res

  expect(target).to.be.a('object').and.include.all.keys('attentions', 'avatar', 'fans', 'hot', 'username', '_id', 'like', 'createdAt', 'updatedAt')
  commonValidate.number(target.attentions)
  commonValidate.poster(target.avatar)
  commonValidate.number(target.fans)
  commonValidate.string(target.username)
  commonValidate.objectId(target._id)
  commonValidate.date(target.createdAt)
  commonValidate.date(target.updatedAt)
  expect(target.like).to.be.a('boolean')

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
  let update

  before(function(done) {

    const { model:self, token } = mockCreateUser({
      username: COMMON_API,
      mobile: 15632558974
    })
    const { model:user } = mockCreateUser({
      username: COMMON_API
    })

    selfToken = token

    Promise.all([
      self.save(),
      user.save()
    ])
    .then(([self, user]) => {
      result = user
      UserModel.updateOne({
        mobile: 15632558974
      }, {
        $push: { fans: { _id: self._id } }
      })
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
    .then(_ => {
      done()
    })
    .catch(err => {
      console.log('oops: ', err)
    })

  })

  describe(`pre check the visitor has token and adjust url test -> ${COMMON_API}`, function() {

    describe(`pre check the visitor has token and adjust url success test -> ${COMMON_API}`, function() {      

      it(`pre check th visitor has token and adjust url success`, function(done) {

        Request
        .get(COMMON_API)
        .query({ _id: result._id.toString() })
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

    describe(`pre check the visitor has token and adjust url fail test -> ${COMMON_API}`, function() {

      it(`pre check the visitor has token and adjust url fail because not token and has the _id`, function(done) {

        Request
        .get(COMMON_API)
        .query({ _id: result._id.toString() })
        .expect(302)
        .end(function(err) {
          if(err) return done(err)
          done()
        })

      })

      it(`pre check the visitor has token and adjust url fail because lack of the params of user id and has the token`, function(done) {

        Request
        .get(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(400)
        .expect('Content-Type', /json/)
        .end(function(err) {
          if(err) return done(err)
          done()
        })

      })

      it(`pre check the visitor has token and adjust url fail because lack of the params of user id and the token`, function(done) {

        Request
        .get(COMMON_API)
        .set({
          Accept: 'application/json',
        })
        .expect(403)
        .expect('Content-Type', /json/)
        .end(function(err) {
          if(err) return done(err)
          done()
        })

      })

    })

  })

  describe(`get the user info and not self and with self info test -> ${COMMON_API}`, function() {

    describe(`get the user info and not self and with self info success test -> ${COMMON_API}`, function() {

      before(async function() {

        await UserModel.findOne({
          mobile: 15632558974
        })
        .select({
          _id: 0,
          updatedAt: 1
        })
        .then(data => {
          updatedAt = data._doc.updatedAt
        })
        .catch(err => {
          console.log('oops: ', err)
        })

        return Promise.resolve()
      })

      it(`get the user info and not self and with self info success and return the status of 304`, function(done) {

        const query = {
          _id: result._id.toString()
        }

        const etag = createEtag(query)

        Request
        .get(COMMON_API)
        .query({...query})
        .set({
          Accept: 'application/json',
          'If-Modified-Since': updatedAt.toString(),
          'If-None-Match': etag,
          Authorization: `Basic ${selfToken}`
        })
        .expect(304)
        .expect('Last-Modified', updatedAt.toString())
        .expect('ETag', etag)
        .end(function(err) {
          if(err) return done(err)
          done()
        })

      })

      it(`get the user info and not self and with self info success and hope return the status of 304 but the content has edited`, function(done) {

        const query = {
          _id: result._id.toString()
        }

        const etag = createEtag(query)

        Request
        .get(COMMON_API)
        .query(query)
        .set({
          Accept: 'Application/json',
          'If-Modified-Since': new Date(Day(result.updatedAt).valueOf - 10000000),
          'If-None-Match': etag,
          Authorization: `Basic ${selfToken}`
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .expect('Last-Modified', updatedAt.toString())
        .expect('ETag', etag)
        .end(function(err, res) {
          if(err) return done(err)
          done()
        })

      })

      it(`get the user info and not self and with self info success and hope return the status of 304 but the params of query is change`, function(done) {

        const query = {
          _id: result._id.toString()
        }

        Request
        .get(COMMON_API)
        .query(query)
        .set({
          Accept: 'Application/json',
          'If-Modified-Since': updatedAt,
          'If-None-Match': createEtag({
            ...query,
            count:9
          }),
          Authorization: `Basic ${selfToken}`
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .expect('Last-Modified', updatedAt.toString())
        .expect('ETag', createEtag(query))
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })


    })

    describe(`get the user info and not self and with self info success test -> ${COMMON_API}`, function() { 

      it(`get the user info and not self and with self info fail because the params of id is not found`, function(done) {

        const _id = result._id.toString()

        Request
        .get(COMMON_API)
        .query({ _id: `${(parseInt(_id.slice(0, 1)) + 5) % 10}${_id.slice(1)}` })
        .set('Accept', 'Application/json')
        .set({
          Authorization: `Basic ${selfToken}`
        })
        .expect(404)
        .expect('Content-Type', /json/)
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

      it(`get the user info and not self and with self info fail because the params of id is not verify`, function(done) {

        Request
        .get(COMMON_API)
        .query({ _id: result._id.toString().slice(1) })
        .set('Accept', 'Application/json')
        .set({
          Authorization: `Basic ${selfToken}`
        })
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