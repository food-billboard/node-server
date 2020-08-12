const App = require('../app')
const path = require('path')
const Request = require('supertest').agent(App.listen())
const { assert } = require('chai')

const COMMON_API = '/api/customer/movie/detail/store'

describe(`${COMMON_API} test`, function() {

  describe(`pre check the params -> ${COMMON_API}`, function() {

  })

  describe(`put store the movie test -> ${COMMON_API}`, function() {

  })

  describe(`cancel store the movie test -> ${COMMON_API}`, function() {

  })

})