require('module-alias/register')
const {  } = require('@src/utils')
const { expect } = require('chai')
const { Request, commonValidate } = require('@test/utils')
const { Types: { ObjectId } } = require("mongoose")

const COMMON_API = '/api/manage/movie'

function responseExpect(res, validate=[]) {
  const { res: { data: target } } = res

  if(Array.isArray(validate)) {
    validate.forEach(valid => {
      typeof valid == 'function' && valid(target)
    })
  }else if(typeof validate === 'function') {
    validate(target)
  }
}

describe(`${COMMON_API} test`, function() {

  describe(`${COMMON_API} success test`, function() {

    describe(`get the movie list success -> ${COMMON_API}`, function() {

    })

    describe(`post the movie success -> ${COMMON_API}`, function() {

    })

    describe(`put the movie success -> ${COMMON_API}`, function() {

    })

    describe(`delete the movie success -> ${COMMON_API}`, function() {

    })

  })

  describe(`${COMMON_API} fail test`, function() {
    
    describe(`get the movie list fail -> ${COMMON_API}`, function() {

      it(`get the movie list fail because the classify id is not verify`, function(done) {

      })

      it(`get the movie list fail because the start_date is not verify`, function(done) {

      })

      it(`get the movie list fail because the end_date is not verify`, function(done) {

      })

      it(`get the movie list fail because the status is not verify`, function(done) {

      })

      it(`get the movie list fail because the content is not verify`, function(done) {

      })

      it(`get the movie list fail because the source_type is not verify`, function(done) {

      })

    })

    describe(`post the movie fail -> ${COMMON_API}`, function() {

    })

    describe(`put the movie fail -> ${COMMON_API}`, function() {
      
    })

    describe(`delete the movie fail -> ${COMMON_API}`, function() {
      
      it(`delete the movie fail beause the movie id is not verify`, function() {

      })

      it(`delete the movie fail because lack of the movie id`, function() {

      })

      it(`delete the movie fail because the user is not authorization`, function() {
        
      })

    })

  })

})