const App = require('../app')
const path = require('path')
const Request = require('supertest').agent(App.listen())
const { assert } = require('chai')

const COMMON_API = '/api/customer/user/comment'

describe(`${COMMON_API} test`, function() {

  describe(`get the user comment list and not self and with self info test -> ${COMMON_API}`, function() {

    describe(`get the user comment list and not self and with self info success test -> ${COMMON_API}`, function() {

      it(`get the user comment list and not self and with self info success`, function() {

      })

      it(`get the user comment list and not self and with self info success but the list'length is 0`, function() {
        
      })

    })

  })

})
