require('module-alias/register')
const { MovieModel, SearchModel, UserModel } = require('@src/utils')
const { expect } = require('chai')
const { Request, commonValidate, mockCreateSearch, mockCreateUser, mockCreateMovie } = require('@test/utils')
const { Types: { ObjectId } } = require("mongoose")

const COMMON_API_KEYWORD = '/api/manage/dashboard/movie/keyword'
const COMMON_API_TYPE = '/api/manage/dashboard/movie/type'

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

describe(`${COMMON_API_KEYWORD} and ${COMMON_API_TYPE} test`, function() {

  describe(`${COMMON_API_KEYWORD} success test`, function() {

    it(`get the keyword list success`, function(done) {

    })

  })

  describe(`${COMMON_API_TYPE} success test`, function() {

    it(`get the type statistics success`, function(done) {
      
    })

  })

  // describe(`${COMMON_API_KEYWORD} fail test`, function() {
    
  // })

  // describe(`${COMMON_API_TYPE} fail test`, function() {
    
  // })

})