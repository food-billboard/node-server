const App = require('../app')
const path = require('path')
const Request = require('supertest').agent(App.listen())
const { assert } = require('chai')

const COMMON_API = '/api/customer/user'

describe(`${COMMON_API} test`, function() {

  describe(`pre check the visitor has token and adjust url test -> ${COMMON_API}`, function() {

    describe(`pre check the visitor has token and adjust url success test -> ${COMMON_API}`, function() {      

      it(`pre check th visitor has token and adjust url success `, function() {

      })

    })

    describe(`pre check the visitor has token and adjust url fail test -> ${COMMON_API}`, function() {

      it(`pre check the visitor has token and adjust url fail because the request method is not valid`, function() {

      })

      it(`pre check the visitor has token and adjust url fail because not token`, function() {

      })

      it(`pre check the visitor has token and adjust url fail because lack of the params of user id`, function() {

      })

      it(`pre check the visitor has token and adjust url fail because lack of params of user id and token`, function() {

      })

    })

  })

  describe(`get the user info and not self and with self info test -> ${COMMON_API}`, function() {

    describe(`get the user info and not self and with self info success test -> ${COMMON_API}`, function() {

      it(`get he user info and not self and with self info success`, function() {

      })

    })

  })

})