const App = require('../app')
const path = require('path')
const Request = require('supertest').agent(App.listen())
const { assert } = require('chai')

const COMMON_API = '/api/customer/manage/info/avatar'

describe(`${COMMON_API} test`, function() {

  describe(`put the new avatar test -> ${COMMON_API}`, function() {

    describe(`put the new avatar success test -> ${COMMON_API}`, function() {

      it(`put the new avatar success`, function() {

      })

    })

    describe(`put the new avatar fail test -> ${COMMON_API}`, function() {

      it(`put the new avatar fail because the image is not found`, function() {

      })

      it(`put the new avatar fail because the image is not allow use or unauth`, function() {

      })

    })

  })

}) 