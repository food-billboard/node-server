require('module-alias/register')
const App = require('../app')
const Request = require('supertest').agent(App.listen())
const { assert } = require('chai')

const COMMON_API = '/api/user/customer/movie'

describe(`${COMMON_API} test`, function() {

  describe(`get another user issue movie list without self info test -> ${COMMON_API}`, function() {

  })

})