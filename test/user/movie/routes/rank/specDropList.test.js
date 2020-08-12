require('module-alias/register')
const App = require('../app')
const Request = require('supertest').agent(App.listen())
const { assert } = require('chai')

const COMMON_API = '/api/user/customer/movie/rank/specDropList'

describe(`${COMMON_API} test`, function() {

  describe(`get rank specDropList test -> ${COMMON_API}`, function() {
    
  })

})