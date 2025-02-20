require('module-alias/register')
const { expect } = require('chai')
const { mockCreateClassify, mockCreateImage, Request, commonValidate, createEtag } = require('@test/utils')
const { ClassifyModel, ImageModel } = require('@src/utils')
const Day = require('dayjs')

const COMMON_API = '/api/user/movie/classify/specDropList'

function responseExpect(res, validate=[]) {

  const { res: { data: target } } = res 

  expect(target).to.be.a('array')
  target.forEach(item => {
    expect(item).to.be.a('object').and.that.includes.any.keys('name', 'icon', '_id', 'updatedAt', "key")
    commonValidate.string(item.name)
    if(item.icon) {
      commonValidate.string(item.icon)
    }
    if(item.key) {
      commonValidate.string(item.key)
    }
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

  describe(`get classify type list test -> ${COMMON_API}`, function() {
    
    describe(`get classify type list success test -> ${COMMON_API}`, function() {

      let result
  
      before(function(done) {
        const { model } = mockCreateImage({
          src: COMMON_API
        })

        model.save()
        .then(data => {
          const { model } = mockCreateClassify({
            name: COMMON_API,
            icon: data._id
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

      it(`get classify type list success`, function(done) {

        Request
        .get(COMMON_API)
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

      it.skip(`get classify type list success and return the status of 304`, function(done) {

        Request
        .get(COMMON_API)
        .set({
          Accept: 'Application/json',
          'If-Modified-Since': result.updatedAt,
          'If-None-Match': createEtag({})
        })
        .expect(304)
        .expect('Last-Modified', result.updatedAt.toString())
        .expect('ETag', createEtag({}))
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

      it.skip(`get classify type list success and hope return the status of 304 but the content has edited`, function(done) {

        Request
        .get(COMMON_API)
        .set({
          Accept: 'Application/json',
          'If-Modified-Since': new Date(Day(result.updatedAt).valueOf - 10000000),
          'If-None-Match': createEtag({})
        })
        .expect(200)
        .expect('Last-Modified', result.updatedAt.toString())
        .expect('ETag', createEtag({}))
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

      it.skip(`get classify type list success and hope return the status of 304 but the params of query is change`, function(done) {

        Request
        .get(COMMON_API)
        .set({
          Accept: 'Application/json',
          'If-Modified-Since': new Date(Day(result.updatedAt).valueOf - 10000000),
          'If-None-Match': createEtag({
            count: 10
          })
        })
        .expect(200)
        .expect('Last-Modified', result.updatedAt.toString())
        .expect('ETag', createEtag({}))
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

    })

    describe(`get classify type list fail test -> ${COMMON_API}`, function() {

      // it(`get classify type list fail because the list's length is 0`, function(done) {

      //   Request
      //   .get(COMMON_API)
      //   .set({
      //     Accept: 'Application/json'
      //   })
      //   .expect(404)
      //   .expect('Content-Type', /json/)
      //   .end(function(err, _) {
      //     if(err) return done(err)
      //     done()
      //   })

      // })

    })

  })

})