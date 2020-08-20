require('module-alias/register')
const App = require('../app')
const Request = require('supertest').agent(App.listen())
const { assert } = require('chai')

const COMMON_API = '/api/user/customer/attention'

describe(`${COMMON_API} test`, function() {

  describe(`get another user attention test -> ${COMMON_API}`, function() {

    describe(`get another user attention success test -> ${COMMON_API}`, function() {

      it(`get another user attention success`, function() {

      })

      it(`get another user attention success but the list's length is 0`, function() {
        
      })

    })

    describe(`get another user attention fail test -> ${COMMON_API}`, function() {
      
      it(`get another user attention fail because the user id is not found`, function() {
        
      })

    })

  })

})