require('module-alias/register')
const { expect } = require('chai')
const { 
  mockCreateMovie, 
  mockCreateImage, 
  Request, 
  commonValidate,
  createEtag
} = require('@test/utils')
const { MovieModel, ImageModel } = require('@src/utils')
const Day = require('dayjs')

const COMMON_API = '/api/user/movie/detail/simple'

function responseExpect(res, validate=[]) {

  const { res: { data: target } } = res 

  expect(target).to.be.a('object').that.includes.all.keys('description', 'name', 'poster', '_id')
  commonValidate.string(target.description)
  commonValidate.string(target.name)
  commonValidate.poster(target.poster)
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

  describe(`get the movie detail simply without self info test -> ${COMMON_API}`, function() {

    let result

    before(function(done) {

      const { model:image } = mockCreateImage({
        src: COMMON_API
      })

      image.save()
      .then(data => {
        imageId = data._id
        const { model } = mockCreateMovie({
          poster: data._id,
          name: COMMON_API
        })

        return model.save()
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
        ImageModel.deleteMany({
          src: COMMON_API
        }),
        MovieModel.deleteMany({
          name: COMMON_API
        }),
      ])
      .then(function() {
        done()
      })
      .catch(err => {
        console.log('oops: ', err)
      })

    })
    
    describe(`get the movie detail simply without self info success test -> ${COMMON_API}`, function() {

      it(`get the movie detail simply without self info success`, function(done) {

        Request
        .get(COMMON_API)
        .query({
          _id: result._id.toString()
        })
        .set({
          Accept: 'Application/json',
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

      it.skip(`get the movie detail simply without self info success and return the status of 304`, function(done) {

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

      it.skip(`get the movie detail simply without self info success and hope return the status of 304 but the content has edited`, function(done) {

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
        .expect('Last-Modified', result.updatedAt.toString())
        .expect('ETag', createEtag(query))
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

      it.skip(`get the movie detail simply without self info success and hope return the status of 304 but the params of query is change`, function(done) {

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
        .expect('Last-Modified', result.updatedAt.toString())
        .expect('ETag', createEtag({
          _id: result._id.toString()
        }))
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

    })

    describe(`get the movie detail simply without self info fail test -> ${COMMON_API}`, function() {
      
      it(`get the movie detail simply without self info fail because the movie id is not found`, function(done) {

        const _id = result._id.toString()

        Request
        .get(COMMON_API)
        .query({
          _id: `${(parseInt(_id.slice(0, 1)) + 5) % 10}${_id.slice(1)}`
        })
        .set({
          Accept: 'Application/json'
        })
        .expect(404)
        .expect('Content-Type', /json/)
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

      it(`get the movie detail simply without self info fail because the movie id is not verify`, function(done) {

        Request
        .get(COMMON_API)
        .query({
          _id: result._id.toString().slice(1)
        })
        .set({
          Accept: 'Application/json'
        })
        .expect(400)
        .expect('Content-Type', /json/)
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

      it(`get the movie detail simply without self info fail because lack of the movie id`, function(done) {
        
        Request
        .get(COMMON_API)
        .set({
          Accept: 'Application/json'
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