require('module-alias/register')
const {  } = require('@src/utils')
const { expect } = require('chai')
const { Request, commonValidate } = require('@test/utils')
const { Types: { ObjectId } } = require("mongoose")

const COMMON_API = '/api/manage/movie/detail'

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

    it(`get the movie detail sucess`, function() {

    })

  })

  describe(`${COMMON_API} fail test`, function() {

    it(`pre check the movie id fail because the id is not verify`, function() {

    })

    it(`pre check the movie id fail because the id is not found`, function() {
      
    })
    
    it(`get the movie fail because the movie id is not verify`, function() {

    })

    it(`get the movie fail because lack of the movie id`, function() {

    })

    it(`get the movie fail because the movie id is not found`, function() {
      
    })

  })

})