require('module-alias/register')
const App = require('../app')
const Request = require('supertest').agent(App.listen())
const { assert } = require('chai')

const COMMON_API = '/api/user/customer/movie/detail/comment/list'

describe(`${COMMON_API} test`, function() {

  describe(`get the comment list test -> ${COMMON_API}`, function() {
    
    describe(`get the comment list success test -> ${COMMON_API}`, function() {

      it(`get the comment list success`, function() {

      })

      it(`get the comment list success but the list's length is 0`, function() {
        
      })

    })

    describe(`get the comment list fail test -> ${COMMON_API}`, function() {
      
      it(`get the comment list fail because the movie id is not found`, function() {

      })

      it(`get the comment list fail because the movie id is not verify`, function() {

      })

      it(`get the comment list fail because lack of the movie id`, function() {
        
      })

    })  

  })

})