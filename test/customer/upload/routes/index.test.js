const App = require('../app')
const path = require('path')
const Request = require('supertest').agent(App.listen())
const { assert } = require('chai')

const COMMON_API = '/api/customer/upload/chunk'

describe(`${COMMON_API} test`, function() {

  describe(`pre check the params -> ${COMMON_API}`, function() {

  })

  describe(`check the file is exists and adjust the database test -> ${COMMON_API}`, function() {

  })

  describe(`post the file of chunk test -> ${COMMON_API}`, function() {

  })

  describe(`put the file complete upload test -> ${COMMON_API}`, function() {

  })

})