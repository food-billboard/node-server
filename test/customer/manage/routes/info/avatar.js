const App = require('../app')
const path = require('path')
const Request = require('supertest').agent(App.listen())
const { assert } = require('chai')

const COMMON_API = '/api/customer/manage/info/avatar'

describe(`${COMMON_API} test`, function() {

  describe(`put the new avatar test -> ${COMMON_API}`, function() {

  })

}) 