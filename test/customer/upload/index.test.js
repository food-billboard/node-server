const App = require('../app')
const path = require('path')
const Request = require('supertest').agent(App.listen())
const { assert } = require('chai')

const COMMON_API = '/api/customer/upload'

describe(`${COMMON_API} test`, function() {

  describe(`pre check the file size -> ${COMMON_API}`, function() {

  })

  describe(`post the little size file test -> ${COMMON_API}`, function() {

  })

})
