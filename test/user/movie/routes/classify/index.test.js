require('module-alias/register')
const { expect } = require('chai')
const { mockCreateClassify, mockCreateMovie, mockCreateImage, Request, commonValidate } = require('@test/utils')

const COMMON_API = '/api/user/movie/classify'

function responseExpect(res, validate=[]) {

  const { res: { data: target } } = res 

  expect(target).to.be.a('array')
  target.forEach(item => {
    expect(item).to.be.a('object').and.that.includes.all.keys('hot', 'info', 'name', 'poster', '_id')
    commonValidate.number(item.hot)
    expect(item.info).to.be.a('object').and.have.a.property('classify').and.is.a('array')
    item.info.classify.forEach(cls => {
      expect(cls).to.be.a('object').and.have.a.property('name').and.is.a('string').that.lengthOf.above(0)
    })
    expect(item.info.classify).to.be.a()
    commonValidate.string(item.name)
    commonValidate.poster(item.poster)
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

  describe(`get classify list test -> ${COMMON_API}`, function() {

    let movieDatabase
    let classifyDatabase
    let imageDatabase
    let imageId
    let result

    before(function(done) {
      const { model } = mockCreateImage({
        src: COMMON_API
      })
      imageDatabase = model
      imageDatabase.save()
      .then(function(data) {
        imageId = data._id
        const { model } = mockCreateMovie({
          name: COMMON_API,
          info: {
            classify: []
          },
          poster: imageId
        })
        movieDatabase = model
        return movieDatabase.save()
      })
      .then(data => {
        const { model } = mockCreateClassify({
          name: COMMON_API,
          match: [data._id]
        })
        classifyDatabase = model
        return classifyDatabase.save()
      })
      .then(function(data) {
        result = data
        return movieDatabase.updateOne({
          name: COMMON_API
        }, {
          $push: { "info.classify": result._id }
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

      Promise.all([
        movieDatabase.deleteOne({
          name: COMMON_API
        }),
        classifyDatabase.deleteOne({
          name: COMMON_API
        }),
        imageDatabase.deleteOne({
          src: COMMON_API
        })
      ])
      .then(function() {
        done()
      })
      .catch(err => {
        console.log('oops: ', err)
      })

    })
    
    describe(`get classify list success test -> ${COMMON_API}`, function() {

      it(`get classify list success`, function(done) {

        Request
        .get(COMMON_API)
        .query({ 
          _id: result._id.toString()
        })
        .set({
          Accept: 'Application/json'
        })
        .expect(200)
        .expect({ 'Content-Type': /json/ })
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

      it(`get classify list success and return the status of 304`, function(done) {

        const query = {
          _id: result._id.toString()
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

      it(`get classify list success and hope return the status of 304 but the content has edited`, function(done) {

        const query = {
          _id: result._id.toString()
        }

        Request
        .get(COMMON_API)
        .query(query)
        .set({
          Accept: 'Application/json',
          'If-Modified-Since': new Date(Day(result.updatedAt).valueOf - 10000000),
          'If-None-Match': createEtag(query)
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

      it(`get classify list success and hope return the status of 304 but the params of query is change`, function(done) {

        const query = {
          offset: 0,
          _id: result._id.toString()
        }

        Request
        .get(COMMON_API)
        .query({
          _id: result._id.toString()
        })
        .set({
          Accept: 'Application/json',
          'If-Modified-Since': new Date(Day(result.updatedAt).valueOf - 10000000),
          'If-None-Match': createEtag(query)
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

    describe(`get classify list fail test -> ${COMMON_API}`, function() {

      it(`get classify list fail because the classify id is not found`, function(done) {

        const _id = result._id.toString()

        Request
        .get(COMMON_API)
        .query({ _id: `${(parseInt(_id.slice(0, 1)) + 5) % 10}${_id.slice(1)}` })
        .set('Accept', 'Application/json')
        .expect(404)
        .expect('Content-Type', /json/)
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

      it(`get classify list fail because the classify id is not verify`, function(done) {

        Request
        .get(COMMON_API)
        .query({ _id: _id.slice(1) })
        .set('Accept', 'Application/json')
        .expect(400)
        .expect('Content-Type', /json/)
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

      it(`get classify list fail because lack of the params of classify id`, function(done) {

        Request
        .get(COMMON_API)
        .set('Accept', 'Application/json')
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