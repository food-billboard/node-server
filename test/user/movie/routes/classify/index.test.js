require('module-alias/register')
const App = require('../app')
const Request = require('supertest').agent(App.listen())
const { assert } = require('chai')

const COMMON_API = '/api/user/customer/movie/classify'

describe(`${COMMON_API} test`, function() {

  describe(`get classify list test -> ${COMMON_API}`, function() {
    
    describe(`get classify list success test -> ${COMMON_API}`, function() {

      it(`get classify list success`, function() {

      })

      it(`get classify list success but the list's length is 0`, function() {
        
      })

    })

    describe(`get classify list fail test -> ${COMMON_API}`, function() {

      it(`get classify list fail because the classify id is not found`, function() {

      })

      it(`get classify list fail because the classify id is not verify`, function() {

      })

      it(`get classify list fail because lack of the params of classify id`, function() {

      })

    })

  })

})