const App = require('../app')
const path = require('path')
const Request = require('supertest').agent(App.listen())
const { assert } = require('chai')

const COMMON_API = '/api/customer/manage/movie/detail'

describe(`${COMMON_API} test`, function() {

  describe(`get the movie detail with self info test -> ${COMMON_API}`, function() {

    describe(`get the movie detail width self info success test -> ${COMMON_API}`, function() {

      it(`get the movie dtail success`, function() {

      })

    })

    describe(`get the movie detail width self info fail test -> ${COMMON_API}`, function() {

      it(`get the movie detail fail because of the movie id is not found or is not verify`, function() {

      })

    })

  })

}) 