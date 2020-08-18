const App = require('../app')
const path = require('path')
const Request = require('supertest').agent(App.listen())
const { assert } = require('chai')

const COMMON_API = '/api/customer/movie/detail/store'

describe(`${COMMON_API} test`, function() {

  describe(`pre check the params -> ${COMMON_API}`, function() {

    describe(`pre check the pramas success test -> ${COMMON_API}`, function() {

      it(`pre check the params success`, function() {

      })

    })

    describe(`pre check the params fail test -> ${COMMON_API}`, function() {

      it(`pre check the params fail because the movie id is not verify or not found`, function() {

      })

    })

  })

  describe(`put store the movie test -> ${COMMON_API}`, function() {

    describe(`put store the movie success test -> ${COMMON_API}`, function() {

      it(`put store the movie success`, function() {

      })

    })

  })

  describe(`cancel store the movie test -> ${COMMON_API}`, function() {

    describe(`cancel store the movie success test -> ${COMMON_API}`, function() {

      it(`cancel store the movie success`, function() {
        
      })

    })

  })

})