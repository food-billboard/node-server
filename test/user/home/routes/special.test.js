require('module-alias/register')
const App = require('../app')
const Request = require('supertest').agent(App.listen())
const { assert } = require('chai')

const COMMON_API = '/api/user/customer/movie/special'

describe(`${COMMON_API} test`, function() {

  describe(`get home special list test -> ${COMMON_API}`, function() {

    describe(`get home special list success test -> ${COMMON_API}`, function() {

      it(`get home special list success`, function() {

      })

      it(`get home special list success but the movie list's length is 0`, function() {

      })

    })

    describe(`get home special list fail test -> ${COMMON_API}`, function() {

      it(`get home special list fail because the special id is not found or not verify`, function() {

      })
      
      it(`get home special list fail because lack of the params of special id`, function() {

      })

    })

  })

})