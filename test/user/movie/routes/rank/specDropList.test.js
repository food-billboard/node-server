require('module-alias/register')
const App = require('../app')
const Request = require('supertest').agent(App.listen())
const { assert } = require('chai')

const COMMON_API = '/api/user/customer/movie/rank/specDropList'

describe(`${COMMON_API} test`, function() {

  describe(`get rank specDropList test -> ${COMMON_API}`, function() {
    
    describe(`get rank type list success test -> ${COMMON_API}`, function() {

      it(`get rank type list success`, function() {

      })

      it(`get rank type list success but the list's length is 0`, function() {

      })

    })

  })

})