const App = require('../app')
const path = require('path')
const Request = require('supertest').agent(App.listen())
const { assert } = require('chai')

const COMMON_API = '/api/customer/movie/detail/rate'

describe(`${COMMON_API} test`, function() {

  describe(`put rate for the movie test -> ${COMMON_API}`, function() {

    describe(`put rate for the movie success test -> ${COMMON_API}`, function() {

      it(`put rate success`, function() {

      })

    })

    describe(`put rate for the movie fail test -> ${COMMON_API}`, function() {

      it(`put rate fail because the movie id is not found or not verify`, function() {

      })

      it(`put rate fail because the params of rate is not verify`, function() {
        
      })

    })

  })

})