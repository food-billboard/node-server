require('module-alias/register')
const { expect } = require('chai')
const { mockCreateUser, Request } = require('@test/utils')

const COMMON_API = '/api/user/customer/attention'

function responseExpect(res, validate=[]) {

  const { res: { data: target } } = res

  expect(target).have.a.property('0').and.to.be.a('object').that.includes.all.keys('avatar', 'username', '_id')
  expect(target).have.a.property('0').and.have.a.property('avatar').to.be.a('string')
  expect(target).have.a.property('0').and.have.a.property('username').to.be.a('string')
  expect(target).have.a.property('0').and.have.a.property('_id').to.be.a('string')

  if(Array.isArray(validate)) {
    validate.forEach(valid => {
      typeof valid == 'function' && valid(target)
    })
  }else if(typeof validate == 'function') {
    validate(target)
  }
}

describe(`${COMMON_API} test`, function() {

  describe(`get another user attention test -> ${COMMON_API}`, function() {

    let database
    let attentionId
    let result

    before(function(done) {

      const { model } = mockCreateUser({
        username: '关注用户测试名字',
        mobile: 11256981236
      })
      model.save()
      .then(function(data) {
        const { _id } = data
        attentionId = _id
        const { model } = mockCreateUser({
          username: '测试名字',
          attentions: [
            _id
          ]
        })
        database = model
        return database.save()
      })
      .then(function(data) {
        result = data
        done()
      })
      .catch(err => {
        console.log('oops: ', err)
      })
    })

    after(function(done) {
      database.deleteMany({
        _id: { $in: [ attentionId, result._id ] }
      })
      .then(function() {
        done()
      })
    })

    describe(`get another user attention success test -> ${COMMON_API}`, function() {

      it(`get another user attention success`, function(done) { 
        Request
        .get(COMMON_API)
        .query({ _id: result._id.toString() })
        .set('Content-Type', 'Appication/json')
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

      it(`get another user attention success and return the status of 304`, function(done) {

        Request
        .get(COMMON_API)
        .query({ _id: result._id.toString() })
        .set('Content-Type', 'Appication/json')
        .set('If-Modified-Since', result.updatedAt)
        .expect(304)
        .expect('Content-Type', /json/)
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

    })

    describe(`get another user attention fail test -> ${COMMON_API}`, function() {
      
      it(`get another user attention fail because the user id is not found`, function(done) {

        const errorId = result._id.toString()

        Request
        .get(COMMON_API)
        .query({ _id: `${(parseInt(errorId.slice(0, 1)) + 5) % 10}${errorId.slice(1)}` })
        .set('Content-Type', 'Appication/json')
        .expect(404)
        .expect('Content-Type', /json/)
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

      it(`get another user attention fail because the user id is not verify`, function(done) {

        Request
        .get(COMMON_API)
        .query({ _id: result._id.toString().slice(1) })
        .set('Content-Type', 'Appication/json')
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