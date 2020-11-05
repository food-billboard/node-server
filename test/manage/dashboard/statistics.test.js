require('module-alias/register')
const {  } = require('@src/utils')
const { expect } = require('chai')
const { Request, commonValidate } = require('@test/utils')
const { Types: { ObjectId } } = require("mongoose")

const COMMON_API_USER = '/api/manage/dashboard/statistics/user'
const COMMON_API_MOVIE = '/api/manage/dashboard/statistics/movie'
const COMMON_API_VISIT = '/api/manage/dashboard/statistics/visit'

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

describe(`${COMMON_API_USER} and ${COMMON_API_MOVIE} and ${COMMON_API_VISIT} test`, function() {

  describe(`${COMMON_API_USER} success test`, function() {

    it(`get register user statistics success`, function(done) {

    })

  })

  describe(`${COMMON_API_MOVIE} success test`, function() {

    it(`get movie statistics success`, function(done) {

    })

  })

  describe(`${COMMON_API_VISIT} success test`, function() {

    it(`get user visit statistics success`, function(done) {

    })

  })

  // describe(`${COMMON_API} fail test`, function() {
    
  // })

})