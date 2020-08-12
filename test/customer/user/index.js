const App = require('../app')
const path = require('path')
const Request = require('supertest').agent(App.listen())
const { assert } = require('chai')

const COMMON_API = '/api/customer/user'

describe(`${COMMON_API} test`, function() {

  describe(`pre check the visitor has token and adjust url test -> ${COMMON_API}`, function() {

  })

  describe(`get the user info and not self and with self info test -> ${COMMON_API}`, function() {

  })

})