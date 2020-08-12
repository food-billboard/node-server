const App = require('../app')
const path = require('path')
const Request = require('supertest').agent(App.listen())
const { assert } = require('chai')

const COMMON_API = '/api/customer/movie/detail/comment'

describe(`${COMMON_API} test`, function() {

  describe(`pre check the params -> ${COMMON_API}`, function() {

  })

  describe(`get the movie comment list with self info test -> ${COMMON_API}`, function() {

  })

  describe(`post the comment for movie test -> ${COMMON_API}`, function() {

  })

  describe(`post the comment for user test -> ${COMMON_API}`, function() {

  })

})