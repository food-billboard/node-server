require('module-alias/register')
const App = require('../app')
const Request = require('supertest').agent(App.listen())
const { assert } = require('chai')

const COMMON_API = '/api/user/movie/notice'

describe(`${COMMON_API} test`, function() {

  describe(`get home notice info test -> ${COMMON_API}`, function() {

    describe(`get home notice info success test -> ${COMMON_API}`, function() {

      it(`get home notice info success`, function() {

      })

    })

  })

})