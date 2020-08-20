require('module-alias/register')
const App = require('../app')
const Request = require('supertest').agent(App.listen())
const { assert } = require('chai')

const COMMON_API = '/api/user/customer/movie/classify/specDropList'

describe(`${COMMON_API} test`, function() {

  describe(`get classify type list test -> ${COMMON_API}`, function() {
    
    describe(`get classify type list success test -> ${COMMON_API}`, function() {

      it(`get classify type list success`, function() {

      })

      it(`get classify type list success but the list's length is 0`, function() {

      })

    })

  })

})