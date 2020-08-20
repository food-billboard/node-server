require('module-alias/register')
const App = require('../app')
const Request = require('supertest').agent(App.listen())
const { assert } = require('chai')

const COMMON_API = '/api/user/customer/movie/rank'

describe(`${COMMON_API} test`, function() {

  describe(`get rank list test -> ${COMMON_API}`, function() {
    
    describe(`get rank list success test -> ${COMMON_API}`, function() {

      it(`get rank list success`, function() {

      })

      it(`get rank list success but the list's length is 0`, function() {
        
      })

    })

    describe(`get rank list fail test -> ${COMMON_API}`, function() {

      it(`get rank list fail because the rank id is not found`, function() {

      })

      it(`get rank list fail because the rank id is not verify`, function() {

      })

      it(`get rank list fail because lack of the params of rank id`, function() {

      })

    })

  })

})