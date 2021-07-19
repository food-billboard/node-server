require('module-alias/register')
const { expect } = require('chai')
const { mockCreateClassify, mockCreateMovie, mockCreateImage, Request, commonValidate, createEtag } = require('@test/utils')
const { ClassifyModel, MovieModel, ImageModel } = require('@src/utils')
const Day = require('dayjs')

const COMMON_API = '/api/user/movie/classify'

function responseExpect(res, validate=[]) {

  const { res: { data: target } } = res 

  expect(target).to.be.a('array')
  target.forEach(item => {
    expect(item).to.be.a('object').and.that.includes.all.keys('hot', 'classify', 'publish_time', 'name', 'poster', '_id', 'images')
    commonValidate.number(item.hot)
    commonValidate.time(item.publish_time)
    expect(item.classify).to.be.a('array')
    item.classify.forEach(cls => {
      expect(cls).to.be.a('object').and.have.a.property('name').and.is.a('string').that.lengthOf.above(0)
    })
    expect(item.images).to.be.a('array')
    item.images.forEach(img => {
      commonValidate.string(img)
    })
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

    let imageId
    let result
    let updatedAt

    before(function(done) {
      const { model } = mockCreateImage({
        src: COMMON_API
      })

      model.save()
      .then(function(data) {
        imageId = data._id
        const { model } = mockCreateMovie({
          name: COMMON_API,
          info: {
            classify: []
          },
          poster: imageId
        })
        return model.save()
      })
      .then(data => {
        const { model } = mockCreateClassify({
          name: COMMON_API,
          // match: [data._id]
        })

        return model.save()
      })
      .then(function(data) {
        result = data

        return MovieModel.updateOne({
          name: COMMON_API
        }, {
          $push: { "info.classify": result._id }
        })
      })
      .then(function(data) {
        done()
      })
      .catch(err => {
        console.log('oops: ', err)
      })
    })

    after(function(done) {

      Promise.all([
        MovieModel.deleteMany({
          name: COMMON_API
        }),
        ClassifyModel.deleteOne({
          name: COMMON_API
        }),
        ImageModel.deleteOne({
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

      it.skip(`get classify list success and return the status of 304`, async function() {

        const query = {
          _id: result._id.toString()
        }

        await ClassifyModel.findOne({
          _id: result._id
        })
        .select({
          updatedAt: 1,
          _id: 0
        })
        .exec()
        .then(data => !!data && data._doc.updatedAt)
        .then(data => {
          updatedAt = data
        })
        .catch(err => {
          console.log('oops: ', err)
        })

        await Request
        .get(COMMON_API)
        .query(query)
        .set({
          Accept: 'Application/json',
          'If-Modified-Since': updatedAt,
          'If-None-Match': createEtag(query)
        })
        .expect(304)
        .expect('Last-Modified', updatedAt.toString())
        .expect('ETag', createEtag(query))

        return Promise.resolve()

      })

      it.skip(`get classify list success and hope return the status of 304 but the content has edited`, function(done) {

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
        .expect('Last-Modified', updatedAt.toString())
        .expect('ETag', createEtag(query))
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

      it.skip(`get classify list success and hope return the status of 304 but the params of query is change`, function(done) {

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
          'If-Modified-Since': updatedAt.toString(),
          'If-None-Match': createEtag(query)
        })
        .expect(200)
        .expect('Last-Modified', updatedAt.toString())
        .expect('ETag', createEtag({ _id: result._id.toString() }))
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
          const { res: { data } } = obj
          expect(data).to.be.a('array').and.that.lengthOf(0)
          done()
        })

      })

      it(`get classify list fail because the classify id is not verify`, function(done) {

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