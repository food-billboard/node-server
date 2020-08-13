const App = require('../app')
const path = require('path')
const Request = require('supertest').agent(App.listen())
const { assert } = require('chai')

const COMMON_API = '/api/customer'

describe(`${COMMON_API} test`, function() {

  describe(`pre check token test -> ${COMMON_API}`, function() {

    describe(`success test`, function() {

      it(`complete the token verify test`, function(done) {

      })

    })

    describe(`fail test`, function() {

      it(`fail the token verify because of without the token test`, function(done) {

      })

      it(`fail the token verify because of the token the outof date`, function(done) {

      })

    })
    
  })

  describe(`get barrage list test -> ${COMMON_API}`, function() {

    describe(`get the movie barrage list success test`, function() {

      it(`success get test`, function(done) {

      })

    })

    describe(`get the movie barrage list fail test`, function() {

      it(`get list fail because of not have the movie id param`, function() {

      })

      it(`get list fail because of the database can not find the movie id`, function() {

      })

    })

  })

  describe(`put barrage test -> ${COMMON_API}`, function() {
    
    describe(`put barrage success`, function() {

      it(`put the movie barrage success`, function() {

      })

    })

    describe(`put barrage fail`, function() {

      it(`put the barrrage fail because of without token`, function() {

      })

      it(`put the barrage fail because of unverify movie id or without movie id`, function() {

      })

    })

  })

  describe(`post like the barrage test -> ${COMMON_API}`, function() {

    

  })

  describe(`cancel like the barrage test -> ${COMMON_API}`, function() {

  })

})