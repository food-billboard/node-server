require('module-alias/register')
const App = require('../app')
const Request = require('supertest').agent(App.listen())
const { assert } = require('chai')

const COMMON_API = '/api/user/customer/movie/detail/comment/list'

describe(`${COMMON_API} test`, function() {

  describe(`get the comment list test -> ${COMMON_API}`, function() {
    
  })

})