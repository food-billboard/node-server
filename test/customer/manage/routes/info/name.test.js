const App = require('../app')
const path = require('path')
const Request = require('supertest').agent(App.listen())
const { assert } = require('chai')

const COMMON_API = '/api/customer/manage/info/name'

describe(`${COMMON_API} test`, function() {

  describe(`put the new name test -> ${COMMON_API}`, function() {

    describe(`put the new name success test -> ${COMMON_API}`, function() {

      it(`put the new name success`, function() {

      })

    })

    describe(`put the new name fail test -> ${COMMON_API}`, function() {

      it(`put the new name fail because the name is exists`, function() {

      })


    })

  })

}) 