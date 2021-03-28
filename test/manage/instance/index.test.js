require('module-alias/register')
const { GlobalModel, UserModel } = require('@src/utils')
const { expect } = require('chai')
const { Request, commonValidate, mockCreateUser, mockCreateClassify } = require('@test/utils')
const Day = require('dayjs')

const COMMON_API = '/api/manage/instance/info'

function responseExpect(res, validate=[]) {
  const { res: { data: target } } = res
  expect(target).to.be.a('object').and.that.include.all.keys('list', 'total')
  commonValidate.number(target.total)
  expect(target.data).to.be.a('array')
  target.data.forEach(item => {
    expect(item).to.be.a('object').and.that.include.all.keys('notice', 'info', 'valid', '_id', 'visit_count', 'createdAt', 'updatedAt')
    commonValidate.string(item.notice)
    commonValidate.string(item.info)
    commonValidate.number(item.visit_count)
    commonValidate.objectId(item._id)
    commonValidate.time(item.createdAt)
    commonValidate.time(item.updatedAt)
    expect(item.valid).to.be.a('boolean')
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

  let userInfo
  let selfToken
  let movieId
  let classifyId

  before(function(done) {

    Promise.all([
      
    ])
    .catch(err => {
      console.log('oops: ', err)
    })

  })

  after(function(done) {

    Promise.all([

    ])
    .then(_ => {
      done()
    })
    .catch(err => {
      console.log('oops: ', err)
    })

  })

  describe(`${COMMON_API} get instance list test`, function() {
      
    describe(`${COMMON_API} get instance list success test`, function() {
      
    })

    describe(`${COMMON_API} get instance list fail test`, function() {
      
    })

  })

  describe(`${COMMON_API} post instance test`, function() {
      
    describe(`${COMMON_API} post instance success test`, function() {
      
    })

    describe(`${COMMON_API} post instance fail test`, function() {
      
      it(`post the instance fail because the user not the auth`, function() {

      })

    })

  })

  describe(`${COMMON_API} put instance test`, function() {
      
    describe(`${COMMON_API} put instance success test`, function() {
      
    })

    describe(`${COMMON_API} put instance fail test`, function() {
      
      it(`put the instance fail because the user not the auth`, function() {
        
      })

    })

  })

  describe(`${COMMON_API} delete instance test`, function() {
      
    describe(`${COMMON_API} delete instance success test`, function() {
      
    })

    describe(`${COMMON_API} delete instance fail test`, function() {
      
      it(`delete the instance fail because the user not the auth`, function() {
        
      })

    })

  })

})