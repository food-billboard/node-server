require('module-alias/register')
const App = require('../app')
const Request = require('supertest').agent(App.listen())
const { assert } = require('chai')

const COMMON_API = '/api/user/setting/info'

describe(`${COMMON_API} test`, function() {

  describe(`get the mini app info test -> ${COMMON_API}`, function() {
    
  })

})