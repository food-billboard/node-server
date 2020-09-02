require('module-alias/register')
const { expect } = require('chai')
const { mockCreateUser, mockCreateMovie, mockCreateClassify, Request, createEtag } = require('@test/utils')
const mongoose = require('mongoose')
const { Types: { ObjectId } } = mongoose

const COMMON_API = '/api/user/customer/movie/store'

function responseExpect(res, validate=[]) {

  const { res: { data: target } } = res

  expect(target).to.be.a('array')

  target.forEach(item => {
    expect(item).to.be.a('object').and.includes.all.keys('description', 'name', 'poster', '_id', 'store', 'rate', 'classify', 'publish_time', 'hot')
    expect(item.description).to.be.a('string')
    expect(item.name).to.be.a('string').and.that.lengthOf.above(0)
    expect(item.poster).to.be.satisfies(function(target) {
      return target == null ? true : typeof target === 'string'
    })
    expect(item._id).to.be.satisfies(function(target) {
      return ObjectId.isValid(target)
    })
    expect(item._id).to.be.a('boolean')
    expect(item.rate).to.be.a('number')
    //classify
    expect(item.classify).to.be.a('array').and.that.lengthOf.above(0)
    item.forEach(classify => {
      expect(classify).to.be.a('object').and.that.has.a.property('name').and.that.is.a('string')
    })
    expect(item.publish_time).to.be.satisfies(function(target) {
      return typeof target === 'number' || Object.prototype.toString.call(target) === '[object Date]'
    })  
    expect(item.hot).to.be.a('number')
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

  describe(`get another user store movie list without self info test -> ${COMMON_API}`, function() {

    let userDatabase
    let movieDatabase
    let classifyDatabase
    let result

    before(function(done) {
      const { model } = mockCreateClassify({
        name: COMMON_API
      })
      classifyDatabase = model
      classifyDatabase.save()
      .then(data => {
        const { model } = mockCreateMovie({
          name: COMMON_API,
          info: {
            classify: [ data._id ]
          }
        })
        movieDatabase = model
        model.save()
      })
      .then(function(data) {
        const { model } = mockCreateUser({
          username: COMMON_API,
          glance: [ data._id ]
        })
        userDatabase = model
        return userDatabase.save()
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
      Promise.all([
        userDatabase.deleteOne({
          username: COMMON_API
        }),
        movieDatabase.deleteOne({
          name: COMMON_API
        }),
        classifyDatabase.deleteOne({
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

    describe(`get another user store movie list without self info success test -> ${COMMON_API}`, function() {

      it(`get another user store movie list without self info success`, function(done) {

        Request
        .get(COMMON_API)
        .query('_id', userDatabase._id.toString())
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

      it(`get another user store movie list without self info success and return the status 304`, function(done) {

        const query = {
          _id: userDatabase._id.toString()
        }
        
        Request
        .get(COMMON_API)
        .query(query)
        .set({
          Accept: 'Application/json',
          'If-Modified-Since': userDatabase.updatedAt,
          'If-None-Match': createEtag(query)
        })
        .expect(304)
        .expect({
          'Content-Type': /json/,
          'Last-Modified': userDatabase.updatedAt,
          'ETag': createEtag(query)
        })
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

    })

    describe(`get another user store movie list without self info fail test -> ${COMMON_API}`, function() {
      
      it(`get another user store movie list without self info fail because the user id is not found`, function(done) {
        
        const errorId = result._id.toString()

        Request
        .get(COMMON_API)
        .query({ _id: `${(parseInt(errorId.slice(0, 1)) + 5) % 10}${errorId.slice(1)}` })
        .set('Accept', 'Appication/json')
        .expect(404)
        .expect('Content-Type', /json/)
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

      it(`get another user store movie list without self info fail because the user id is not verify`, function(done) {
        
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