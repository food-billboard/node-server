const App = require('../app')
const path = require('path')
const Request = require('supertest').agent(App.listen())
const { assert } = require('chai')
import { UserModel, BarrageModel, encoded } from '@src/utils'
import { mockCreateUser } from '@test/utils'

const COMMON_API = '/api/customer/barrage'

describe(`${COMMON_API} test`, function() {

  describe(`pre check token test -> ${COMMON_API}`, function() {

    describe(`success test`, function() {

      const {
        beforeEach:_beforeEach,
        afterEach:_afterEach,
        token
      } = mockCreateUser()

      beforeEach(_beforeEach)

      it(`complete the token verify test`, function(done) {
        Request
        .get(COMMON_API)
        .expect('Authorization', `Basic ${token}`)
        .expect(200)
      })

      afterEach(_afterEach)

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

    it(`like the barrage fail because of the movie id is not fuound`, function() {

    })

    it(`like the barrage fail because of the the params have not the movie id`, function() {

    })

  })

  describe(`cancel like the barrage test -> ${COMMON_API}`, function() {

    it(`cancel like the barrage fail because of the movie id is not fuound`, function() {

    })

    it(`cancel like the barrage fail because of the the params have not the movie id`, function() {
      
    })

  })

})