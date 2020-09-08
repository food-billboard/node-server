require('module-alias/register')
const { expect } = require('chai')
const { mockCreateUser, Request, createEtag, commonValidate, mockCreateClassify, mockCreateMovie } = require('@test/utils')

const COMMON_API = '/api/customer/manage/movie/store'

function responseExpect(res, validate=[]) {

  const { res: { data: target } } = res

  expect(target).to.be.a('object').and.that.have.a.property('browser')

  target.browser.forEach(item => {
    expect(item).to.be.a('object').and.includes.all.keys('description', 'name', 'poster', '_id', 'store', 'rate', 'classify', 'publish_time', 'hot')
    commonValidate.string(item.description, function() { return true })
    commonValidate.string(item.name)
    commonValidate.poster(item.poster)
    commonValidate.objectId(item._id)
    expect(item.store).to.be.a('boolean')
    commonValidate.number(item.rate)
    //classify
    expect(item.classify).to.be.a('array').and.that.lengthOf.above(0)
    item.forEach(classify => {
      expect(classify).to.be.a('object').and.that.has.a.property('name').and.that.is.a('string')
    })
    commonValidate.time(item.publish_time) 
    commonValidate.number(item.hot)
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

  describe(`get the self store list test -> ${COMMON_API}`, function() {

    let userDatabase
    let movieDatabase
    let classifyDatabase
    let selfToken
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
        const { model, token } = mockCreateUser({
          username: COMMON_API,
          glance: [ data._id ],
          store: [ data._id ]
        })
        selfToken = token
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

    describe(`get the self store list success test -> ${COMMON_API}`, function() {

      it(`get the self store list success`, function(done) {

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

      it(`get the self store list success and return the status of 304`, function(done) {

        Request
        .get(COMMON_API)
        .set({
          Accept: 'Application/json',
          'If-Modified-Since': result.updatedAt,
          'If-None-Match': createEtag({}),
          Authorization: `Basic ${selfToken}`
        })
        .expect(304)
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

      it(`get the self store list success and hope return the status of 304 but the content has edited`, function(done) {


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

      it(`get the self store list success and hope return the status of 304 but the params of query is change`, function(done) {

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

}) 