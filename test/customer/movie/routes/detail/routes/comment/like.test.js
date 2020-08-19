const App = require('../app')
const path = require('path')
const Request = require('supertest').agent(App.listen())
const { assert } = require('chai')

const COMMON_API = '/api/customer/movie/detail/comment/like'

describe(`${COMMON_API} test`, function() {

  describe(`put like the comment test -> ${COMMON_API}`, function() {

    describe(`put like the comment success test -> ${COMMON_API}`, function() {

      it(`put like the comment success test `, function() {

      })

    })

    describe(`put like the comment fail test -> ${COMMON_API}`, function() {

      it(`put like the comment fail because the comment id is not found`, function() {

      })

    })

  })

  describe(`cancel like the comment test -> ${COMMON_API}`, function() {

    describe(`cancel like the comment success test -> ${COMMON_API}`, function() {

      it(`cancel like the comment success`, function() {

      })

    })

    describe(`cancel like the comment fail test -> ${COMMON_API}`, function() {

      it(`cancel like the comment fail because the comment is is not found`, function() {
        
      })

    })

  })

})