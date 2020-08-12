require('module-alias/register')
const App = require('../app')
const Request = require('supertest').agent(App.listen())
const { assert } = require('chai')

const COMMON_API = '/api/user/customer/movie/detail/simple'

describe(`${COMMON_API} test`, function() {

  describe(`get the movie detail simpley without self info test -> ${COMMON_API}`, function() {
    
  })

})