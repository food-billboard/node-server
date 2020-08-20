require('module-alias/register')
const App = require('../app')
const Request = require('supertest').agent(App.listen())
const { assert } = require('chai')

const COMMON_API = '/api/user/customer/home/store'

describe(`${COMMON_API} test`, function() {

  describe(`get home daily list test -> ${COMMON_API}`, function() {

    describe(`get home daily list success test -> ${COMMON_API}`, function() {

      it(`get home daily list success`, function() {

      })

      it(`get home daily list success but the list's length is 0`, function() {
        
      })

    })

  })

})