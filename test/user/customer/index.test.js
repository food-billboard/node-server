require('module-alias/register')
const App = require('../app')
const Request = require('supertest').agent(App.listen())
const { assert } = require('chai')

const COMMON_API = '/api/user/customer'

describe(`${COMMON_API} test`, function() {

  describe(`get another userinfo and not self and without self info test -> ${COMMON_API}`, function() {

    describe(`get another userinfo and not self and without self info success test -> ${COMMON_API}`, function() {

      it(`get another userinfo and not self and without self info success`, function() {

      })

    })

    describe(`get another userinfo and not self and without self info fail test -> ${COMMON_API}`, function() {
      
      it(`get another userinfo and not self and without self info fail because of the movie id is not found or verify`, function() {
        
      })

    })

  })

})
