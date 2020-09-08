require('module-alias/register')
const { expect } = require('chai')
const { mockCreateUser, Request, commonValidate } = require('@test/utils')

const COMMON_API = '/api/customer/manage/info/name'

describe(`${COMMON_API} test`, function() {

  describe(`put the new name test -> ${COMMON_API}`, function() {

    let selfDatabase
    let selfToken
    let result

    before(function(done) {

      const { model, token } = mockCreateUser({
        username: 'common',
        mobile: 15698775364
      })
      selfDatabase = model
      selfToken = token

      selfDatabase.save()
      .then(data => {
        result = data
        done()
      })
      .catch(err => {
        console.log('oops: ', err)
      })

    })

    after(function(done) {

      selfDatabase.deleteOne({
        mobile: 15698775364
      })
      .then(function() {
        done()
      })
      .catch(err => {
        console.log('oops: ', err)
      })

    })

    describe(`put the new name success test -> ${COMMON_API}`, function() {

      after(function(done) {

        selfDatabase.findOne({
          username: COMMON_API
        })
        .select({
          _id: 1
        })
        .exec()
        .then(data => !!data && data._id)
        .then(data => {
          commonValidate.objectId(data)
          done()
        })
        .catch(err => {
          console.log('oops: ', err)
        })

      })

      it(`put the new name success`, function(done) {

        Request
        .put(COMMON_API)
        .send({
          name: COMMON_API
        })
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err) {
          if(err) return done(err)
          done()
        })

      })

    })

    describe(`put the new name fail test -> ${COMMON_API}`, function() {

      it(`put the new name fail because the name is exists`, function(done) {

        done()

      })


    })

  })

}) 