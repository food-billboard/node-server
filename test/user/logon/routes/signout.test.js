require('module-alias/register')
const App = require('../app')
const Request = require('supertest').agent(App.listen())
const { assert } = require('chai')

const COMMON_API = '/api/user/customer/logon/signout'

describe(`${COMMON_API} test`, function() {

  describe(`post for logout test -> ${COMMON_API}`, function() {
    
  })

})