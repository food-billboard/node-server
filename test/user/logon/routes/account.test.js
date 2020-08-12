require('module-alias/register')
const App = require('../app')
const Request = require('supertest').agent(App.listen())
const { assert } = require('chai')

const COMMON_API = '/api/user/customer/logon/account'

describe(`${COMMON_API} test`, function() {

  describe(`post the userinfo for logon test -> ${COMMON_API}`, function() {

  })

})