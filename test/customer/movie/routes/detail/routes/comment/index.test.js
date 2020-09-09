const App = require('../app')
const path = require('path')
const Request = require('supertest').agent(App.listen())
const { assert } = require('chai')

const COMMON_API = '/api/customer/movie/detail/comment'



describe(`${COMMON_API} test`, function() {

  describe(`pre check the params -> ${COMMON_API}`, function() {

    describe(`pre check the params fail test -> ${COMMON_API}`, function() {

      it(`pre check the params fail because the user id is not verify`, function() {

      })

      it(`pre check the params fail because the movie id is not verify`, function() {

      })

      it(`pre check the params fail becuase the image id is not verify`, function() {

      })

      it(`pre check the params fail becuase the image id is not found`, function() {

      })

      it(`pre check the params fail becuase the video id is not verify`, function() {

      })

      it(`pre check the params fail becuase the video id is not found`, function() {

      })

    })

  })

  describe(`get the movie comment list with self info test -> ${COMMON_API}`, function() {

    describe(`get the movie comment list with self info success test -> ${COMMON_API}`, function() {

      it(`get the movie comment list success`, function() {

      })

      it(`get the comment detail with self info success and return the status of 304`, function(done) {



      })

      it(`get the comment detail without self info success and hope return the status of 304 but the content has edited`, function(done) {



      })

      it(`get the comment detail with self info success and hope return the status of 304 but the params of query is change`, function(done) {



      })

    })

  })

  describe(`post the comment for movie test -> ${COMMON_API}`, function() {

    describe(`post the comment for movie success test -> ${COMMON_API}`, function() {

      it(`post the comment for movie success`, function() {

      })

    })

  })

  describe(`post the comment for user test -> ${COMMON_API}`, function() {

    describe(`post the comment for user success test -> ${COMMON_API}`, function() {

      it(`post the comment for user success`, function() {
        
      })

    })

  })

})