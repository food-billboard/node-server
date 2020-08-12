require('module-alias/register')
const App = require('../app')
const Request = require('supertest').agent(App.listen())
const { assert } = require('chai')

const COMMON_API = '/api/user/customer/fans'

describe(`${COMMON_API} test`, function() {

  describe(`get another user fans test -> ${COMMON_API}`, function() {

  })

})