const App = require('../app')
const path = require('path')
const Request = require('supertest').agent(App.listen())
const { assert } = require('chai')

const COMMON_API = '/api/customer/manage/comment'

describe(`${COMMON_API} test`, function() {

  describe(`get self comment success test -> ${COMMON_API}`, function() {
    
    it(`get self comment success `, function() {

    })

    it(`get self comment success but the list's length is 0`, function() {

    })

  })

})