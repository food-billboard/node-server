require('module-alias/register')
const App = require('../app')
const Request = require('supertest').agent(App.listen())
const { assert } = require('chai')

const COMMON_API = '/api/user/customer/comment'

describe(`${COMMON_API} test`, function() {

  describe(`get another user comment test -> ${COMMON_API}`, function() {

    describe(`get another user comment success test -> ${COMMON_API}`, function() {

      it(`get another user comment success`, function() {

      })

      it(`get another user comment but the list's length is 0`, function() {
        
      })

    })

    describe(`get another user comment fail test -> ${COMMON_API}`, function() {
      
      it(`get another user comment fail because the user id is not found`, function() {
        
      })

    })

  })

})