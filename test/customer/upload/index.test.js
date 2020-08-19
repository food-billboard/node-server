const App = require('../app')
const path = require('path')
const Request = require('supertest').agent(App.listen())
const { assert } = require('chai')

const COMMON_API = '/api/customer/upload'

describe(`${COMMON_API} test`, function() {

  describe(`pre check the token test -> ${COMMON_API}`, function() {

    describe(`pre check the token success test -> ${COMMON_API}`, function() {

      it(`pre check the token success`, function() {

      })

    })

    describe(`pre check the token fail test -> ${COMMON_API}`, function() {

      it(`pre check the token fail because not found the params of token`, function() {

      })

      it(`pre check the token fail because the token is not verify or delay`, function() {

      })

    })

  })

  describe(`pre check the file size -> ${COMMON_API}`, function() {

    describe(`pre check the file size success test -> ${COMMON_API}`, function() {

      it(`pre check the file size success`, function() {

      })

    })

    describe(`pre check the file size fail test ->${COMMON_API}`, function() {

      it(`pre check the file size fail because the file size is too large`, function() {

      })

    })

  })


  describe(`post the little size file test -> ${COMMON_API}`, function() {

    describe(`post the little size file success test -> ${COMMON_API}`, function() {

      it(`post the little size file success`, function() {

      })

    })

  })

})
