const App = require('../app')
const path = require('path')
const Request = require('supertest').agent(App.listen())
const { assert } = require('chai')

const COMMON_API = '/api/customer/movie/detail'

describe(`${COMMON_API} test`, function() {

  describe(`get the movie detail info with self info test -> ${COMMON_API}`, function() {

  })

})