const App = require('../app')
const path = require('path')
const Request = require('supertest').agent(App.listen())
const { assert } = require('chai')

const COMMON_API = '/api/customer/manage'

describe(`${COMMON_API} test`, function() {

  describe(`pre check params test -> ${COMMON_API}`, function() {

    describe(`pre check params success test -> ${COMMON_API}`, function() {

    })

    describe(`pre check params fail test -> ${COMMON_API}`, function() {

      it(`pre check params fail because of the token is expired`, function() {

      })

      it(`pre check params fail because of the token is not verify`, function() {

      })

    })

  })

  describe(`get self userinfo test -> ${COMMON_API}`, function() {

    describe(`get self userinfo test success -> ${COMMON_API}`, function() {

      it(`get self userinfo test test success`, function() {

      })

    })

    describe(`get self userinfo test fail -> ${COMMON_API}`, function() {

      it(`get self userinfo fail because of the database has not the user`, function() {
        
      })
      
    })

  })

})
