const App = require('../app')
const path = require('path')
const Request = require('supertest').agent(App.listen())
const { assert } = require('chai')

const COMMON_API = '/api/customer/manage/attention'

describe(`${COMMON_API} test`, function() {

  describe(`pre check the params test -> ${COMMON_API}`, function() {

  })

  describe(`get self attention list -> ${COMMON_API}`, function() {

  })

  describe(`put the new user for attention -> ${COMMON_API}`, function() {

  })

  describe(`cancel the user attention -> ${COMMON_API}`, function() {

  })

})