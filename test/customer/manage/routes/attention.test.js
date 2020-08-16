const App = require('../app')
const path = require('path')
const Request = require('supertest').agent(App.listen())
const { assert } = require('chai')

const COMMON_API = '/api/customer/manage/attention'

describe(`${COMMON_API} test`, function() {

  describe(`pre check the params test -> ${COMMON_API}`, function() {

    describe(`pre check the params success -> ${COMMON_API}`, function() {
      it('pre check the params success', function() {

      })
    })

    describe(`pre check params fail test -> ${COMMON_API}`, function() {

      it(`pre check params fail becasue of the movie id is not verify`, function() {

      })

      it(`pre check params fail because of the movie id is not found in database`, function() {

      })

    })

  })

  describe(`get self attention list -> ${COMMON_API}`, function() {

    describe(`get self attentions list success test -> ${COMMON_API}`, function() {
      
      it(`get self attentions list success`, function() {

      })

      it(`get self attentions list success and the list's length is 0`, function() {

      })

    })

  })

  describe(`put the new user for attention -> ${COMMON_API}`, function() {

    describe(`put the new user for attention success test -> ${COMMON_API}`, function() {

      it(`put the new user for attention success`, function() {

      })

      it(`put the new user for attentions success but the user is attentioned`, function() {

      })

    })

  })

  describe(`cancel the user attention -> ${COMMON_API}`, function() {

    describe(`cancel the new user for attention success test -> ${COMMON_API}`, function() {

      it(`cancel the new user for attention success`, function() {

      })

      it(`cancel the new user for attentions success but the user is not attentioned`, function() {
        
      })

    })

  })

})