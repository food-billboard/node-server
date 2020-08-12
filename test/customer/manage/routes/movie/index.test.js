const App = require('../app')
const path = require('path')
const Request = require('supertest').agent(App.listen())
const { assert } = require('chai')

const COMMON_API = '/api/customer/manage/movie'

describe(`${COMMON_API} test`, function() {

  describe(`pre check the uploading movie is valid test -> ${COMMON_API}`, function() {

  })

  describe(`post the new movie test ${COMMON_API}`, function() {

  })

  describe(`put the previous upload movie test ${COMMON_API}`, function() {

  })

  describe(`get hte previous self upload movie list test ${COMMON_API}`, function() {

  })

}) 