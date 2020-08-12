require('module-alias/register')
const App = require('../app')
const Request = require('supertest').agent(App.listen())
const { assert } = require('chai')

const COMMON_API = '/api/user/customer/movie/language'

describe(`${COMMON_API} test`, function() {

  describe(`get language list test -> ${COMMON_API}`, function() {
    
  })

})