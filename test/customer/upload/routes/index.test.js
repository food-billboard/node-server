const App = require('../app')
const path = require('path')
const Request = require('supertest').agent(App.listen())
const { assert } = require('chai')

const COMMON_API = '/api/customer/upload/chunk'

describe(`${COMMON_API} test`, function() {

  describe(`pre check the params -> ${COMMON_API}`, function() {

    describe(`pre check the params success test -> ${COMMON_API}`, function() {

      it(`pre check the params success`, function() {

      })

    })

    describe(`pre check the params fail test -> ${COMMON_API}`, function() {

      it(`pre check params fail because the file name is not verify of md5`, function() {

      })

    })

  })

  describe(`check the file is exists and adjust the database test -> ${COMMON_API}`, function() {

    describe(`check the file is exists and adjust the database success test -> ${COMMON_API}`, function() {

      it(`check file is exists and adjust the database success and the file is exists`, function() {

      })

      it(`check file is exists and adjust the database success and the file is not exists`, function() {

      })

      it(`check file is exists and adjust the database success and the file is uploaded but not complete`, function() {

      })

    })

    describe(`check the file is exists and adjust the database fail test -> ${COMMON_API}`, function() {

      it(`check the file is exists and adjust the database fail because the params is not verify or lack`, function() {

      })

    })

  })

  describe(`post the file of chunk test -> ${COMMON_API}`, function() {

    describe(`post the file of chunk success test -> ${COMMON_API}`, function() {

      it(`post the file of chunk success`, function() {

      })

    })

    describe(`post the file of chunk fail test -> ${COMMON_API}`, function() {

      it(`post the file of chunk fail because the params is not verify`, function() {

      })

    })

  })

  describe(`put the file complete upload test -> ${COMMON_API}`, function() {

    describe(`put the file complete upload success test -> ${COMMON_API}`, function() {

      it(`put the file complete upload success`, function() {

      })

    })

    describe(`put the file complete upload fail test -> ${COMMON_API}`, function() {

      it(`put the file complete upload fail because the chunk length is not true`, function() {

      })

      it(`put the file complete upload fail because the params is not verify`, function() {
        
      })

    })

  })

})