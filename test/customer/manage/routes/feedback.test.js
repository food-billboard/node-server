const App = require('../app')
const path = require('path')
const Request = require('supertest').agent(App.listen())
const { assert } = require('chai')

const COMMON_API = '/api/customer/manage/feedback'

describe(`${COMMON_API} test`, function() {

  describe(`pre check the user is feedback frequently -> ${COMMON_API}`, function() {

  })

  describe(`post the feedback test -> ${COMMON_API}`, function() {

  })

})
