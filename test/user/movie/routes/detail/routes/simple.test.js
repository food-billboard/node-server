require('module-alias/register')
const App = require('../app')
const Request = require('supertest').agent(App.listen())
const { assert } = require('chai')

const COMMON_API = '/api/user/customer/movie/detail/simple'

describe(`${COMMON_API} test`, function() {

  describe(`get the movie detail simply without self info test -> ${COMMON_API}`, function() {
    
    describe(`get the movie detail simply without self info success test -> ${COMMON_API}`, function() {

      it(`get the movie detail simply without self info success`, function() {

      })

      it(`get the movie detail simply without self info success but the list's length is 0`, function() {

      })

    })

    describe(`get the movie detail simply without self info fail test -> ${COMMON_API}`, function() {
      
      it(`get the movie detail simply without self info fail because the movie id is not found`, function() {

      })

      it(`get the movie detail simply without self info fail because the movie id is not verify`, function() {

      })

      it(`get the movie detail simply without self info fail because lack of the movie id`, function() {
        
      })

    })

  })

})