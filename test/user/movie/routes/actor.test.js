require('module-alias/register')
const App = require('../app')
const Request = require('supertest').agent(App.listen())
const { assert } = require('chai')

const COMMON_API = '/api/user/customer/movie/actor'

describe(`${COMMON_API} test`, function() {

  describe(`get actor list test -> ${COMMON_API}`, function() {
    
    describe(`get actor list success test -> ${COMMON_API}`, function() {

      it(`get acotr list success`, function() {

      })

      it(`get actor list success but the list's length is 0`, function() {
        
      })

    })

  })

})