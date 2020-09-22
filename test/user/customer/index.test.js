require('module-alias/register')
const { expect } = require('chai')
const { mockCreateUser, Request, createEtag } = require('@test/utils')
const { commonValidate } = require('../../utils')

const COMMON_API = '/api/user/customer'

function responseExpect(res, validate=[]) {

  const { res: { data: target } } = res

  expect(target).to.be.a('object').and.include.all.keys('attentions', 'avatar', 'fans', 'hot', 'username', '_id')
  commonValidate.number(target.attentions)
  commonValidate.poster(target.avatar)
  commonValidate.number(target.fans)
  commonValidate.number(target.hot)
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

  describe(`get another userinfo and not self and without self info test -> ${COMMON_API}`, function() {

    let database
    let result

    before(function(done) {
      const { model } = mockCreateUser({
        username: '测试名字'
      })
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
        username: '测试名字'
      })
      .then(function() {
        done()
      })
    })

    describe(`get another userinfo and not self and without self info success test -> ${COMMON_API}`, function() {

      it(`get another userinfo and not self and without self info success`, function(done) {

        Request
        .get(COMMON_API)
        .query({ _id: result._id.toString() })
        .set('Accept', 'application/json')
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

      it(`get another userinfo and not self and without self info success and return status of 304`, function(done) {

        const query = {
          _id: result._id.toString()
        }

        Request
        .get(COMMON_API)
        .query(query)
        .set('Accept', 'application/json')
        .set('If-Modified-Since', result.updatedAt)
        .set('If-None-Match', createEtag(query))
        .expect(304)
        .expect('Last-Modified', result.updatedAt.toString())
        .expect('ETag', createEtag(query))
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

    })

    describe(`get another userinfo and not self and without self info fail test -> ${COMMON_API}`, function() {
      
      it(`get another userinfo and not self and without self info fail because of the movie id is not verify`, function(done) {
        
        const id = result._id.toString()

        Request
        .get(COMMON_API)
        .query({ _id: id.slice(1) })
        .set('Accept', 'application/json')
        .expect(400)
        .expect('Content-Type', /json/)
        .end(function() {
          done()
        })

      })

      it(`get another userinfo and not self and without self info fail because of the movie id is not found`, function(done) {
        
        const id = result._id.toString()

        Request
        .get(COMMON_API)
        .query({ _id: `${parseInt(id.slice(0, 1) + 1) % 10}${id.slice(1)}` })
        .set('Accept', 'application/json')
        .expect(404)
        .expect('Content-Type', /json/)
        .end(function() {
          done()
        })

      })

    })

  })

})
