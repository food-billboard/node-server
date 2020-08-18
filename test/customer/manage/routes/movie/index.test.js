const App = require('../app')
const path = require('path')
const Request = require('supertest').agent(App.listen())
const { assert } = require('chai')

const COMMON_API = '/api/customer/manage/movie'

describe(`${COMMON_API} test`, function() {

  describe(`pre check the uploading movie is valid test -> ${COMMON_API}`, function() {

    describe(`pre check the uploading movie is valid success test -> ${COMMON_API}`, function() {

      it(`pre check the uploading movie success`, function() {

      })

    })

    describe(`pre check the uploading movie is valid fail test -> ${COMMON_API}`, function() {

      it(`pre check the uploading movie fail because missing some params`, function() {
        
      })

      it(`pre check uploading movie fail because the params is unverify`, function() {

      })

    })

  })

  describe(`post the new movie test ${COMMON_API}`, function() {

    describe(`post the new movie success -> ${COMMON_API}`, function() {

      it(`post hte new movie success`, function() {

      })

    })

  })

  describe(`put the previous upload movie test ${COMMON_API}`, function() {

    describe(`put the previous upload movie success test -> ${COMMON_API}`, function() {

      it(`put the previous upload movie success`, function() {

      })

    })

    describe(`put the previous upload movie fail test -> ${COMMON_API}`, function() {

      it(`put the previous upload movie fail because the movie id is not found or not valid`, function() {

      })

    })

  })

  describe(`get hte previous self upload movie list test ${COMMON_API}`, function() {

    describe(`get the previous self upload movie list success test -> ${COMMON_API}`, function() {

      it(`get the previous self upload movie list success`, function() {

      })

      it(`get the previous self upload movie list success but the list's length is 0`, function() {

      })

    })

  })

}) 