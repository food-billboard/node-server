const App = require('../app')
const path = require('path')
const Request = require('supertest').agent(App.listen())
const { assert } = require('chai')

const COMMON_API = '/api/customer/manage/fans'

describe(`${COMMON_API} test`, function() {

  describe(`get self fans list success test -> ${COMMON_API}`, function() {

    it(`get self fans list success `, function() {

    })

    it(`get self fans list success but the list's length is 0`, function() {

    })

  })

})