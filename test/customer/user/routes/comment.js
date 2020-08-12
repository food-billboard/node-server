const App = require('../app')
const path = require('path')
const Request = require('supertest').agent(App.listen())
const { assert } = require('chai')

const COMMON_API = '/api/customer/user/comment'

describe(`${COMMON_API} test`, function() {

  describe(`get the user comment list and not self and with self info test -> ${COMMON_API}`, function() {

  })

})
