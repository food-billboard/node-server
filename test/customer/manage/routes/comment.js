const App = require('../app')
const path = require('path')
const Request = require('supertest').agent(App.listen())
const { assert } = require('chai')

const COMMON_API = '/api/customer/manage/comment'

describe(`${COMMON_API} test`, function() {

  describe(`get self comment test -> ${COMMON_API}`, function() {

  })

})