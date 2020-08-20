require('module-alias/register')
const App = require('../app')
const Request = require('supertest').agent(App.listen())
const { assert } = require('chai')

const COMMON_API = '/api/user/customer/movie/detail'

describe(`${COMMON_API} test`, function() {

  describe(`get the movie detail without self info test -> ${COMMON_API}`, function() {
    
    describe(`get the movie detail without self info success test -> ${COMMON_API}`, function() {

      it(`get the movie detail without self info success`, function() {

      })

    })

    describe(`get the movie detail without self info fail test -> ${COMMON_API}`, function() {
      
      it(`get the movie detail without self info fail bacause the movie id is not found`, function() {

      })

      it(`get the movie detail without self info fail because the movie id is not verify`, function() {

      })

      it(`get the movie detail without self info fail because lack the params of the movie id`, function() {
        
      })

    })

  })

})