const App = require('../app')
const path = require('path')
const Request = require('supertest').agent(App.listen())
const { assert } = require('chai')

const COMMON_API = '/api/customer/manage/movie/browser'

describe(`${COMMON_API} test`, function() {

  describe(`get the self browser list test -> ${COMMON_API}`, function() {

  })

}) 