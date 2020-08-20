require('module-alias/register')
const App = require('../app')
const Request = require('supertest').agent(App.listen())
const { assert } = require('chai')

const COMMON_API = '/api/user/customer/logon/account'

describe(`${COMMON_API} test`, function() {

  describe(`post the userinfo for logon test -> ${COMMON_API}`, function() {

    describe(`post the userinfo for logon success test -> ${COMMON_API}`, function() {

      it(`post the userinfo for logon success`, function() {

      })

    })

    describe(`post the userinfo for logon fail test -> ${COMMON_API}`, function() {

      it(`post the userinfo for logon fail because the params of mobile is not verify or not found`, function() {

      })
      
      it(`post the userinfo for logon fail becuase the params of password is not verify or not found`, function() {

      })

    })

  })

})