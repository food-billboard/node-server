require('module-alias/register')
const App = require('../app')
const Request = require('supertest').agent(App.listen())
const { assert } = require('chai')

const COMMON_API = '/api/user/customer/logon/register'

describe(`${COMMON_API} test`, function() {

  describe(`post the info for register and verify test -> ${COMMON_API}`, function() {
    
  })

})