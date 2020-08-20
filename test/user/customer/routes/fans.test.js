require('module-alias/register')
const App = require('../app')
const Request = require('supertest').agent(App.listen())
const { assert } = require('chai')

const COMMON_API = '/api/user/customer/fans'

describe(`${COMMON_API} test`, function() {

  describe(`get another user fans test -> ${COMMON_API}`, function() {

    describe(`get another user fans success test -> ${COMMON_API}`, function() {

      it(`get another user fans success`, function() {

      })

      it(`get another user fans but the list's length is 0`, function() {
        
      })

    })

    describe(`get another user fans fail test -> ${COMMON_API}`, function() {
      
      it(`get another user fans because the user id is not found`, function() {
        
      })

    })

  })

})