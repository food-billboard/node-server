const App = require('../app')
const path = require('path')
const Request = require('supertest').agent(App.listen())
const { assert } = require('chai')

const COMMON_API = '/api/customer/manage/fans'

describe(`${COMMON_API} test`, function() {

  describe(`get self fans list -> ${COMMON_API}`, function() {

  })

})