require('module-alias/register')
const App = require('../app')
const Request = require('supertest').agent(App.listen())
const { assert } = require('chai')

const COMMON_API = '/api/user/customer/movie/detail/comment'

describe(`${COMMON_API} test`, function() {

  describe(`get the comment list in movie page test -> ${COMMON_API}`, function() {
    
    describe(`get the comment list in movie page success test -> ${COMMON_API}`, function() {

      it(`get the comment list in movie page success`, function() {

      })

      it(`get the comment list in movie page success but the list's length is 0`)

    })

    describe(`get the comment list in movie page fail test -> ${COMMON_API}`, function() {
      
      it(`get the comment list in movie page fail because the movie id is not found`, function() {

      })

      it(`get the comment list in movie page fail because the movie id is not verify`, function() {

      })

      it(`get the comment list in movie page info fail because lack of the movie id`, function() {
        
      })

    })

  })

})