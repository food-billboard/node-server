require('module-alias/register')
const {  } = require('@src/utils')
const { expect } = require('chai')
const { Request, commonValidate } = require('@test/utils')
const { Types: { ObjectId } } = require("mongoose")

const COMMON_API = '/api/manage/admin'

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

    describe(`get the admin info success -> ${COMMON_API}`, function() {

      it(`get the admin info success`, function(done) {

      })

    })

    describe(`put the admin info success -> ${COMMON_API}`, function() {

      it(`put the admin info of the username success`, function(done) {

      })

      it(`put the admin info of the avatar success`, function(done) {

      })

      it(`put the admin info of the description success`, function(done) {
        
      })

    })

  })

  describe(`${COMMON_API} fail test`, function() {
    
    describe(`put theadmin info fail -> ${COMMON_API}`, function() {

      it(`put the admin info fail because the username's length is to long`, function(done) {

      })

      it(`put the admin info fail because the username's length is to short`, function(done) {

      })

      it(`put the admin info fail because the description's length is to long`, function(done) {

      })

      it(`put the admin info fail because the description's length is to short`, function(done) {

      })

      it(`put the admin info fail because the avatar is not verify`, function(done) {
        
      })

    })

  })

})