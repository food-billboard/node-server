require('module-alias/register')
const App = require('../app')
const Request = require('supertest').agent(App.listen())
const { assert } = require('chai')

const COMMON_API = '/api/user/barrage'

describe(`${COMMON_API} test`, function() {

  describe(`get movie barrage list without self info test -> ${COMMON_API}`, function() {

    describe(`get movie barrage list without self info success test -> ${COMMON_API}`, function() {

      it(`get movie barrage list without self info success`, function() {

      })

      it(`get movie barrage list without self info success but the list's length is 0`, function() {

      })

    })

    describe(`get movie barrage list without self info fail test -> ${COMMON_API}`, function() {
      
      it(`get movie barrage list without self info fail because the movie id is not found or verify`, function() {
        
      })

    })

  })

})