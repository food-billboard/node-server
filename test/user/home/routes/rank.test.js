require('module-alias/register')
const App = require('../app')
const Request = require('supertest').agent(App.listen())
const { assert } = require('chai')

const COMMON_API = '/api/user/home/movie/rank'

describe(`${COMMON_API} test`, function() {

  describe(`get home rank list test -> ${COMMON_API}`, function() {

    describe(`get home rank list success test -> ${COMMON_API}`, function() {

      it(`get home rank list success`, function(done) {
        done()
      })

    })

  })

})