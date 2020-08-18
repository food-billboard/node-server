const App = require('../app')
const path = require('path')
const Request = require('supertest').agent(App.listen())
const { assert } = require('chai')

const COMMON_API = '/api/customer/movie/detail'

describe(`${COMMON_API} test`, function() {

  describe(`get the movie detail info with self info test -> ${COMMON_API}`, function() {

    describe(`get the movie detail info with self info success test -> ${COMMON_API}`, function() {

      it(`get the movie detail info success`, function() {

      })

      it(`get the movie detail info success but without self info`, function() {

      })

    })

    describe(`get the movie detail info with self info fail test -> ${COMMON_API}`, function() {

      it(`get the movie detail info fail because is movie id is not found or unverify`, function() {
        
      })

    })

  })

  describe(`pre check the token is verify test -> ${COMMON_API}`, function() {

    describe(`pre check the token is verify success test -> ${COMMON_API}`, function() {

      it(`pre check the token success`, function() {

      })

    })

    describe(`pre check the token is verify fail test -> ${COMMON_API}`, function() {

      it(`pre check the token fail because of not the params of token`, function() {

      })

      it(`pre check the token fail becuase the token is unverify or delay`, function() {
        
      })

    })

  })

})