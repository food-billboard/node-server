require('module-alias/register')
const App = require('../app')
const Request = require('supertest').agent(App.listen())
const { assert } = require('chai')

const COMMON_API = '/api/user/customer/movie/browser'

describe(`${COMMON_API} test`, function() {

  describe(`get another user browser movie list without self info test -> ${COMMON_API}`, function() {

    describe(`get another user browser movie list without self info success test -> ${COMMON_API}`, function() {

      it(`get another user browser movie list without self info success`, function() {

      })

      it(`get another user browser movie list without self info success but the list's length is 0`, function() {
        
      })

    })

    describe(`get another user browser movie list without self info fail test -> ${COMMON_API}`, function() {
      
      it(`get another user browser movie list without self info fail because the user id is not found`, function() {
        
      })

    })

  })

})