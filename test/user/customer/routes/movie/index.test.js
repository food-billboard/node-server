require('module-alias/register')
const { expect } = require('chai')
const { mockCreateUser, mockCreateMovie, mockCreateClassify, Request, createEtag, commonValidate, commonMovieValid } = require('@test/utils')
const { ClassifyModel, MovieModel, UserModel } = require('@src/utils')

const COMMON_API = '/api/user/customer/movie'

function responseExpect(res, validate=[]) {

  const { res: { data: target } } = res

  expect(target).to.be.a('object').and.have.a.property('issue').that.is.a('array')

  commonMovieValid(target.issue)

  if(Array.isArray(validate)) {
    validate.forEach(valid => {
      typeof valid == 'function' && valid(target)
    })
  }else if(typeof validate == 'function') {
    validate(target)
  }
}

describe(`${COMMON_API} test`, function() {

  describe(`get another user issue movie list without self info test -> ${COMMON_API}`, function() {

    let result
    let userId

    before(function(done) {
      const { model } = mockCreateClassify({
        name: COMMON_API
      })

      model.save()
      .then(data => {
        const { model } = mockCreateMovie({
          name: COMMON_API,
          info: {
            classify: [ data._id ]
          }
        })

        return model.save()
      })
      .then(function(data) {
        const { model } = mockCreateUser({
          username: COMMON_API,
          glance: [ { _id: data._id } ]
        })

        return model.save()
      })
      .then(function(data) {
        result = data
        userId = data._id
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
        }),
        MovieModel.deleteOne({
          name: COMMON_API
        }),
        ClassifyModel.deleteOne({
          name: COMMON_API
        })
      ])
      .then(function() {
        done()
      })
      .catch(err => {
        console.log('oops: ', err)
      })
    })

    describe(`get another user issue movie list without self info success test -> ${COMMON_API}`, function() {

      it(`get another user issue movie list without self info success`, function(done) {

        Request
        .get(COMMON_API)
        .query({'_id': userId.toString()})
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

      it.skip(`get another user issue movie list without self info success and return the status of 304`, function(done) {
        
        const query = {
          _id: userId.toString()
        }

        Request
        .get(COMMON_API)
        .query(query)
        .set({
          Accept: 'Application/json',
          'If-Modified-Since': result.updatedAt,
          'If-None-Match': createEtag(query)
        })
        .expect(304)
        .expect('Last-Modified', result.updatedAt.toString())
        .expect('ETag', createEtag(query))
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

    })

    describe(`get another user issue movie list without self info fail test -> ${COMMON_API}`, function() {
      
      it(`get another user issue movie list without self info fail because the user id is not found`, function(done) {
        
        const errorId = userId.toString()

        Request
        .get(COMMON_API)
        .query({ _id: `${(parseInt(errorId.slice(0, 1)) + 5) % 10}${errorId.slice(1)}` })
        .set('Accept', 'Appication/json')
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
            expect(target.issue.length == 0).to.be.true 
          })
          done()
        })

      })

      it(`get another user issue movie list without self info fail because the user id is not verify`, function(done) {
        
        Request
        .get(COMMON_API)
        .query({ _id: result._id.toString().slice(1) })
        .set('Accept', 'Appication/json')
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