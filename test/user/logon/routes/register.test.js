require('module-alias/register')
const App = require('../app')
const Request = require('supertest').agent(App.listen())
const { assert } = require('chai')

const COMMON_API = '/api/user/customer/logon/register'

describe(`${COMMON_API} test`, function() {

  describe(`post the info for register and verify test -> ${COMMON_API}`, function() {
    
    describe(`post the info for register and verify success test -> ${COMMON_API}`, function() {

      it(`post the info for register and verify success`, function() {

      })

    })

    describe(`post the info for register and verify fail test -> ${COMMON_API}`, function() {

      it(`post the info for register and verify fail because the mobile is exists`, function() {

      })

      it(`post the info for register and verify fail becuase the password is not verify`, function() {

      })

      it(`post the info for register and verify fail becuase lack the params of mobile`, function() {

      })

      it(`post the info for register and verify fail because lack the params of password`, function() {
        
      })

    })

  })

})