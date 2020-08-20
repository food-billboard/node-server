require('module-alias/register')
const App = require('../app')
const Request = require('supertest').agent(App.listen())
const { assert } = require('chai')

const COMMON_API = '/api/user/customer/movie/director'

describe(`${COMMON_API} test`, function() {

  describe(`get director list test -> ${COMMON_API}`, function() {
    
    describe(`get director list success test -> ${COMMON_API}`, function() {

      it(`get director list success`, function() {

      })

      it(`get director list success but the list's length is 0`, function() {
        
      })

    })

  })

})