require('module-alias/register')
const App = require('../app')
const Request = require('supertest').agent(App.listen())
const { assert } = require('chai')

const COMMON_API = '/api/user/customer/movie/district'

describe(`${COMMON_API} test`, function() {

  describe(`get district list test -> ${COMMON_API}`, function() {
    
    describe(`get district list success test -> ${COMMON_API}`, function() {

      it(`get district list success`, function() {

      })

      it(`get district list success but the list's length is 0`, function() {
        
      })

    })

  })

})