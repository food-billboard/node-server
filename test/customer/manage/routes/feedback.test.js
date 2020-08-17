const App = require('../app')
const path = require('path')
const Request = require('supertest').agent(App.listen())
const { assert } = require('chai')

const COMMON_API = '/api/customer/manage/feedback'

describe(`${COMMON_API} test`, function() {

  describe(`pre check the user is feedback frequently -> ${COMMON_API}`, function() {

    describe(`pre check the user is feedback frequently success test -> ${COMMON_API}`, function() {

      it(`pre check the user is feedback frequently success and return yes`, function() {

      })

      it(`pre check the user is feedback frequently success and return false`, function() {

      })

    })

  })

  describe(`post the feedback test -> ${COMMON_API}`, function() {

    describe(`post the feedback test success -> ${COMMON_API}`, function() {

      it(`post the feedback test success`, function() {

      })

    })

  })

})
