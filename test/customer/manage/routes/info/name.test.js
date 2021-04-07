require('module-alias/register')
const { expect } = require('chai')
const { mockCreateUser, Request, commonValidate } = require('@test/utils')
const { UserModel } = require('@src/utils')

const COMMON_API = '/api/customer/manage/info/name'

describe(`${COMMON_API} test`, function() {

  describe(`put the new name test -> ${COMMON_API}`, function() {

    let selfToken
    let userId
    let result

    before(async function() {

      const { model, signToken } = mockCreateUser({
        username: 'common',
        mobile: 15698775364
      })

      await model.save()
      .then(data => {
        result = data
        userId = data._id
        selfToken = signToken(userId)
      })
      .catch(err => {
        console.log('oops: ', err)
      })

      return Promise.resolve()

    })

    after(async function() {

      await UserModel.deleteMany({
        mobile: 15698775364
      })
      .catch(err => {
        console.log('oops: ', err)
      })

      return Promise.resolve()

    })

    describe(`put the new name success test -> ${COMMON_API}`, function() {

      after(async function() {

        const res = await UserModel.findOne({
          _id: userId
        })
        .select({
          _id: 1,
          username: 1
        })
        .exec()
        .then(data => !!data && data._doc.username)
        .then(data => {
          return data === COMMON_API.slice(0, 10)
        })
        .catch(err => {
          console.log('oops: ', err)
          return false
        })

        return res ? Promise.resolve() : Promise.reject(COMMON_API)

      })

      it(`put the new name success`, function(done) {

        Request
        .put(COMMON_API)
        .send({
          name: COMMON_API.slice(0, 10)
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