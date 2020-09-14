require('module-alias/register')
const { expect } = require('chai')
const { mockCreateUser, Request, mockCreateImage, STATIC_FILE_PATH } = require('@test/utils')
const { ImageModel, fileEncoded } = require('@src/utils')
const fs = require('fs')
const root = require('app-root-path')

const COMMON_API = '/api/customer/upload/chunk'

describe(`${COMMON_API} test`, function() {

  describe(`pre check the params -> ${COMMON_API}`, function() {

    describe(`pre check the params fail test -> ${COMMON_API}`, function() {

      it(`pre check params fail because the file name is not verify of md5`, function() {

      })

      it(`pre check params fail because the file name is not found of md5`, function() {

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

      it(`check the file is exists and adjust the database fail because the params of suffix is not found`, function() {

      })

      it(`check the file is exists and adjust the database fail because the params of suffix is not verify`, function() {

      })

      it(`check the file is exists and adjust the database fail because the params of chunksLength is not found`, function() {

      })

      it(`check the file is exists and adjust the database fail because the params of chunksLength is not verify`, function() {

      })

      it(`check the file is exists and adjust the database fail because the params of size is not found`, function() {

      })

      it(`check the file is exists and adjust the database fail because the params of size is not verify`, function() {

      })

    })

  })

  describe(`post the file of chunk test -> ${COMMON_API}`, function() {

    describe(`post the file of chunk success test -> ${COMMON_API}`, function() {

      it(`post the file of chunk success`, function() {

      })

      it(`post the file of chunk success but the file is exists before`, function() {

      })

    })

    describe(`post the file of chunk fail test -> ${COMMON_API}`, function() {

      it(`post the file of chunk fail because the params of index is not verify`, function() {

      })

      it(`post the file of chunk fail because the params of index is not found`, function() {

      })

      it(`post the file of chunk fail because the file is not belong to the user`, function() {

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

      it(`put the file complete upload fail because the file is not belong to this user`, function() {
        
      })

    })

  })

})