require('module-alias/register')
const {  } = require('@src/utils')
const { expect } = require('chai')
const { Request, commonValidate } = require('@test/utils')
const { Types: { ObjectId } } = require("mongoose")

const COMMON_API = '/api/manage/user'

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

    describe(`get usr list success -> ${COMMON_API}`, function() {

      it(`get user list success`, function() {

      })

    })

    describe(`post the user success test -> ${COMMON_API}`, function() {

    })

    describe(`put the user success test -> ${COMMON_API}`, function() {

    })

    describe(`delete the user success test -> ${COMMON_API}`, function() {

    })

  })

  describe(`${COMMON_API} fail test`, function() {
    
    describe(`get usr list fail -> ${COMMON_API}`, function() {

      it(`get user list fail`, function() {

      })

    })

    describe(`post the user fail test -> ${COMMON_API}`, function() {

    })

    describe(`put the user fail test -> ${COMMON_API}`, function() {

    })

    describe(`delete the user fail test -> ${COMMON_API}`, function() {

    })

  })

})