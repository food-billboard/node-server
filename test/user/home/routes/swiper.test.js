require('module-alias/register')
const App = require('../app')
const Request = require('supertest').agent(App.listen())
const { assert } = require('chai')

const COMMON_API = '/api/user/customer/movie/swiper'

describe(`${COMMON_API} test`, function() {

  describe(`get home swiper list test -> ${COMMON_API}`, function() {

    describe(`get home swiper list success test -> ${COMMON_API}`, function() {

      it(`get home swiper list success`, function() {

      })

      it(`get home swiper list success but the list's length is 0`, function() {

      })

    })

  })

})