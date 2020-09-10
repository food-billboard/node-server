require('module-alias/register')
const { expect } = require('chai')
const { 
  mockCreateRank, 
  mockCreateImage,
  Request, 
  commonValidate 
} = require('@test/utils')
const mongoose = require('mongoose')
const { Types: { ObjectId } } = mongoose

const COMMON_API = '/api/user/customer/movie/rank/specDropList'

function responseExpect(res, validate=[]) {
  const { res: { data: target } } = res
         
  expect(target).to.be.a('array')
  target.forEach(item => {
    expect(item).to.be.a('object').and.that.includes.all.keys('name', 'icon', '_id')

    commonValidate.objectId(item._id)
    commonValidate.poster(item.icon)
    commonValidate.string(item.name)

  })

  if(Array.isArray(validate)) {
    validate.forEach(valid => {
      typeof valid == 'function' && valid(target)
    })
  }else if(typeof validate === 'function') {
    validate(target)
  }
}

describe(`${COMMON_API} test`, function() {

  describe(`get rank specDropList test -> ${COMMON_API}`, function() {

    let imageId
    let rankId
    let rankDatabase
    let imageDatabase
    
    before(function(done) {

      const { model } = mockCreateImage({
        src: COMMON_API
      })

      imageDatabase = model

      imageDatabase.save()
      .then(data => {
        imageId = data._id

        const { model } = mockCreateRank({
          name: COMMON_API,
          icon: imageId,
          match_field: {
            _id: ObjectId('53102b43bf1044ed8b0ba36b'),
            field: 'classify'
          }
        })

        rankDatabase = model

        return rankDatabase.save()

      })
      .then(data => {
        rankId = data._id
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
        rankDatabase.deleteOne({
          name: COMMON_API
        })
      ])
      .then(_ => {
        done()
      })
      .catch(err => {
        console.log('oops: ', err)
      })

    })
    
    describe(`get rank type list success test -> ${COMMON_API}`, function() {

      it(`get rank type list success`, function(done) {

        Request
        .get(COMMON_API)
        .set({
          Accept: 'Application/json',
        })
        .expect(304)
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

      it(`get rank list success and return the status of 304`, function(done) {

        Request
        .get(COMMON_API)
        .set({
          Accept: 'Application/json',
          'If-Modified-Since': result.updatedAt,
          'If-None-Match': createEtag({}),
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

      it(`get rank list success and hope return the status of 304 but the content has edited`, function(done) {

        Request
        .get(COMMON_API)
        .set({
          Accept: 'Application/json',
          'If-Modified-Since': new Date(Day(result.updatedAt).valueOf - 10000000),
          'If-None-Match': createEtag({}),
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

      it(`get rank list success and hope return the status of 304 but the params of query is change`, function(done) {

        const query = {
          count: 10
        }

        Request
        .get(COMMON_API)
        .query(query)
        .set({
          Accept: 'Application/json',
          'If-Modified-Since': new Date(Day(result.updatedAt).valueOf - 10000000),
          'If-None-Match': createEtag({}),
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