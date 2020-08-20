require('module-alias/register')
const App = require('../app')
const Request = require('supertest').agent(App.listen())
const { assert } = require('chai')

const COMMON_API = '/api/user/customer/logon/signout'

describe(`${COMMON_API} test`, function() {

  describe(`post for logout test -> ${COMMON_API}`, function() {
    
    describe(`post for logout success test -> ${COMMON_API}`, function() {

      it(`post for logout success`, function() {

      })

    })

    describe(`post for logout fail test -> ${COMMON_API}`, function() {

      it(`post for logout fail because the token is not verify`, function() {
        
      })

    })

  })

})