require('module-alias/register')
const { mockCreateUser, mockCreateComment, Request } = require('@test/utils')
const { expect } = require('chai')

const COMMON_API = '/api/user/customer/comment'

function responseExpect(res, validate=[]) {

  const { res: { data: target } } = res
  

  if(Array.isArray(validate)) {
    validate.forEach(valid => {
      typeof valid == 'function' && valid(target)
    })
  }else if(typeof validate == 'function') {
    validate(target)
  }
}

describe(`${COMMON_API} test`, function() {

  describe(`get another user comment test -> ${COMMON_API}`, function() {

    let database
    let result

    before(function(done) {
      
      const { model } = mockCreateUser({
        username: '测试名字'
      })
      database = model
      database.save()
      .then(function(data) {
        result = data

        const { model } = mockCreateComment({

        })
        
      })
      .catch(err => {
        console.log('oops: ', err)
      })
    })

    after(function(done) {
      database.deleteOne({
        username: '测试名字'
      })
      .then(function() {
        done()
      })
    })

    describe(`get another user comment success test -> ${COMMON_API}`, function() {

      it(`get another user comment success`, function(done) {

      })

      it(`get another user comment success and return the status of 304`, function(done) {

      })

    })

    describe(`get another user comment fail test -> ${COMMON_API}`, function() {
      
      it(`get another user comment fail because the user id is not found`, function() {
        
      })

    })

  })

})