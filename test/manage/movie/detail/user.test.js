require('module-alias/register')
const {  } = require('@src/utils')
const { expect } = require('chai')
const { Request, commonValidate } = require('@test/utils')
const { Types: { ObjectId } } = require("mongoose")

const COMMON_API = '/api/manage/movie/detail/user'

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

    it(`get the visit movie user list success`, function() {

    })

    it(`get the visit movie user list with sort of time`, function() {

    })

    it(`get the visit movie user list with filter of status`, function() {
      
    })

  })

  describe(`${COMMON_API} fail test`, function() {
    
    it(`get the visit movie user list fail because the sort is not verify`, function() {

    })

    it(`get the visit movie user list fail because the status is not verify`, function() {
      
    })

  })

})