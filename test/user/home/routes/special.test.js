require('module-alias/register')
const { expect } = require('chai')
const { mockCreateMovie, mockCreateImage, mockCreateSpecial, mockCreateClassify, Request, createEtag, commonValidate } = require('@test/utils')
const Day = require('dayjs')

const COMMON_API = '/api/user/home/special'

function responseExpect(res, validate=[]) {

  const { res: { data: target } } = res

  expect(target).to.be.a('object').and.that.includes.all.keys('poster', 'movie', 'name', '_id')
  commonValidate.poster(target.poster)
  commonValidate.string(target.name)
  commonValidate.objectId(target._id)
  
  expect(target.movie).to.be.a('array')

  target.movie.forEach(item => {

    expect(item).to.be.a('object').and.to.includes.all.keys('name', 'poster', '_id', 'hot', 'description', 'store', 'rate', 'publish_time', 'classify')
    commonValidate.string(item.name)
    commonValidate.poster(item.poster)
    commonValidate.objectId(item._id)
    commonValidate.number(item.hot)
    commonValidate.string(item.description, () => true)
    expect(item.store).to.be.a('boolean')
    commonValidate.number(item.rate)
    commonValidate.date(item.publish_time)
    expect(item.classify).to.be.a('array').and.that.lengthOf.above(0)
    item.classify.forEach(cls => {
      expect(cls).to.be.a('object').and.that.includes.all.keys('name').and.have.a.property('name').that.is.a('string')
    })
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

  describe(`get home special list test -> ${COMMON_API}`, function() {

    let imageDatabase
    let classifyDatabase
    let movieDatabase
    let specialDatabase
    let specialTestDatabase
    let imageId
    let result
    let resultTest

    before(function(done) {
      const { model: image } = mockCreateImage({
        src: COMMON_API
      })
      const { model: classify } = mockCreateClassify({
        name: COMMON_API
      })
      imageDatabase = image
      classifyDatabase = classify
      Promise.all([
        imageDatabase.save(),
        classifyDatabase.save()
      ])
      .then(function([image, classify]) {
        imageId = image._id
        const { model } = mockCreateMovie({
          name: COMMON_API,
          poster: imageId,
          info: {
            classify: [ classify._id ]
          }
        })
        movieDatabase = model
        return movieDatabase.save()
      })
      .then(function(data) {
        const { model } = mockCreateSpecial({
          movie: data._id,
          poster: imageId,
          name: COMMON_API
        })
        const { model: testModel } = mockCreateSpecial({
          name: `${COMMON_API}-test`,
          poster: imageId,
          info: {
            classify: [ classify._id ]
          }
        })
        specialDatabase = model
        specialTestDatabase = testModel
        return Promise.all([
          specialDatabase.save(),
          specialTestDatabase.save()
        ])
      })
      .then(function([data, testData]) {
        result = data
        resultTest = testData
        done()
      })
      .catch(err => {
        console.log('oops: ', err)
      })
    })

    after(function(done) {
      Promise.all([
        imageDatabase.deleteOne({
          src: COMMON_API
        }),
        movieDatabase.deleteOne({
          name: COMMON_API
        }),
        specialDatabase.deleteOne({
          name: COMMON_API
        }),
        classifyDatabase.deleteOne({
          name: COMMON_API
        }),
        specialTestDatabase.deleteOne({
          name: `${COMMON_API}-test`
        })
      ])
      .then(function() {
        done()
      })
      .catch(err => {
        console.log('oops: ', err)
      })
    })

    describe(`get home special list success test -> ${COMMON_API}`, function() {

      it(`get home special list success`, function(done) {

        Request
        .get(COMMON_API)
        .query({ _id: result._id.toString() })
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

      it(`get home special list success and return the status of 304`, function(done) {

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
        .expect('Last-Modified', result.updatedAt.toString())
        .expect('ETag', createEtag(query))
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

      it(`get home special list success and hope return the status 304 but the the cache is out of time`, function(done) {

        const query = {
          _id: result._id.toString()
        }

        const newDate = new Date((Day(result.updatedAt).valueOf - 10000))

        Request
        .get(COMMON_API)
        .query(query)
        .set({
          Accept: 'Application/json',
          'If-Modified-Since': newDate,
          'If-None-Match': createEtag(query)
        })
        .expect(200)
        .expect('Last-Modified', result.updatedAt.toString())
        .expect('ETag', createEtag(query))
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

      it(`get home special list success and hope return the status 304 but the the resource has edited`, function(done) {

        const query = {
          _id: resultTest._id.toString()
        }

        Request
        .get(COMMON_API)
        .query(query)
        .set({
          Accept: 'Application/json',
          'If-Modified-Since': result.updatedAt,
          'If-None-Match': createEtag({
            ...query,
            pageSize: 10
          })
        })
        .expect(200)
        .expect('Last-Modified', result.updatedAt.toString())
        .expect('ETag', createEtag(query))
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

    })

    describe(`get home special list fail test -> ${COMMON_API}`, function() {

      it(`get home special list fail because the special id is not verify`, function(done) {

        Request
        .get(COMMON_API)
        .query({ _id: result._id.toString().slice(1) })
        .set('Accept', 'Application/json')
        .expect(400)
        .expect('Content-Type', /json/)
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })
      
      it(`get home special list fail because the special id is not found`, function(done) {

        const { _id } = result

        Request
        .get(COMMON_API)
        .query({ _id: `${(parseInt(_id.toString().slice(0, 1)) + 5) % 10}${_id.toString().slice(1)}` })
        .set('Accept', 'Application/json')
        .expect(404)
        .expect('Content-Type', /json/)
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })
      })

    })

  })

})