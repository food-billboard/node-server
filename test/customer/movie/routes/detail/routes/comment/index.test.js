const App = require('../app')
const path = require('path')
const Request = require('supertest').agent(App.listen())
const { assert } = require('chai')

const COMMON_API = '/api/customer/movie/detail/comment'

describe(`${COMMON_API} test`, function() {

  describe(`pre check the params -> ${COMMON_API}`, function() {

    describe(`pre check the params success test -> ${COMMON_API}`, function() {

      it(`pre check the params success`, function() {

      })

    })

    describe(`pre check the params fail test -> ${COMMON_API}`, function() {

      it(`pre check the params fail because the movie id or the user id is not verify or not found`, function() {

      })

      it(`pre check the params fail becuase the media id is not verify or not found`, function() {

      })

    })

  })

  describe(`get the movie comment list with self info test -> ${COMMON_API}`, function() {

    describe(`get the movie comment list with self info success test -> ${COMMON_API}`, function() {

      it(`get the movie comment list success`, function() {

      })

      it(`get the movie comment list success but the list's length is 0`, function() {

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