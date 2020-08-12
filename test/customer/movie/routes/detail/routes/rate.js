const App = require('../app')
const path = require('path')
const Request = require('supertest').agent(App.listen())
const { assert } = require('chai')

const COMMON_API = '/api/customer/movie/detail/rate'

describe(`${COMMON_API} test`, function() {

  describe(`put rate for the movie test -> ${COMMON_API}`, function() {

  })

})