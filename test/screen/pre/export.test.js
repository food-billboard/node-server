require('module-alias/register')
const { UserModel, ScreenModal, ROLES_NAME_MAP } = require('@src/utils')
const { Types: { ObjectId} } = require('mongoose')
const { Request, mockCreateUser, mockCreateScreen } = require('@test/utils')

const COMMON_API = '/api/screen/pre/export'

describe(`${COMMON_API} test`, () => {

  let userInfo
  let screenId
  let selfToken
  let getToken

  before(function(done) {

    const { model, signToken } = mockCreateUser({
      username: COMMON_API
    })

    getToken = signToken

    model.save()
    .then((user) => {
      userInfo = user
      selfToken = getToken(userInfo._id)

      const { model } = mockCreateScreen({
        name: COMMON_API,
        user: userInfo._id 
      })

      return model.save()

    })
    .then(data => {
      screenId = data._id 
    })
    .then(_ => {
      done()
    })
    .catch(err => {
      done(err)
    })

  })

  after(function(done) {

    Promise.all([
      ScreenModal.deleteMany({
        name: COMMON_API
      }),
      UserModel.deleteMany({
        username: COMMON_API
      }),
    ])
    .then(_ => {
      done()
    })
    .catch(err => {
      done(err)
    })

  })
  
  describe(`export screen data success test -> ${COMMON_API}`, function() {

    it(`export the screen success`, function(done) {

      Request
      .post(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        _id: screenId.toString(),
        type: 'screen'
      })
      .expect(200)
      .then(_ => {
        done()
      })
      .catch(err => {
        done(err)
      })

    })

    it(`export the screen and the screen is not self success`, function(done) {

      Promise.all([
        ScreenModal.updateOne({
          _id: screenId
        }, {
          $set: {
            user: ObjectId('8f63270f005f1c1a0d9448ca')
          }
        }),
        UserModel.updateOne({
          _id: userInfo._id 
        }, {
          $set: {
            roles: [ROLES_NAME_MAP.SUPER_ADMIN]
          }
        })
      ])
      .then(_ => {
        Request
        .post(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .send({
          _id: screenId.toString(),
          type: 'screen'
        })
        .expect(200)
      })
      .then(_ => {
        return ScreenModal.updateOne({
          _id: screenId
        }, {
          $set: {
            user: userInfo._id 
          }
        })
      })
      .then(_ => {
        done()
      })
      .catch(err => {
        done(err)
      })
      
    })

  })

  describe(`export the screen model fail test -> ${COMMON_API}`, function() {

    it(`export screen fail because the id is not valid`, function(done) {
      Request
      .post(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        _id: screenId.toString().slice(1),
        type: 'screen'
      })
      .expect(400)
      .then(_ => {
        done()
      })
      .catch(err => {
        done(err)
      })
    })

    it(`export the screen fail because the id is not found`, function(done) {

      Request
      .post(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        _id: '8f63270f005f1c1a0d9448ca',
        type: 'screen'
      })
      .expect(404)
      .then(_ => {
        done()
      })
      .catch(err => {
        done(err)
      })
    })

    it(`export the screen fail because the type is not valid`, function(done) {
      Request
      .post(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        _id: screenId.toString(),
        type: ''
      })
      .expect(400)
      .then(_ => {
        done()
      })
      .catch(err => {
        done(err)
      })
    })

    it(`export the screen and the screen is not self fail because is not the auth`, function(done) {
      Promise.all([
        ScreenModal.updateOne({
          _id: screenId
        }, {
          $set: {
            user: ObjectId('8f63270f005f1c1a0d9448ca')
          }
        }),
        UserModel.updateOne({
          _id: userInfo._id 
        }, {
          $set: {
            roles: [ROLES_NAME_MAP.CUSTOMER]
          }
        })
      ])
      .then(_ => {
        Request
        .post(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .send({
          _id: screenId.toString(),
          type: 'screen'
        })
        .expect(404)
      })
      .then(_ => {
        return Promise.all([
          ScreenModal.updateOne({
            _id: screenId
          }, {
            $set: {
              user: userInfo._id 
            }
          }),
          UserModel.updateOne({
            _id: userInfo._id 
          }, {
            $set: {
              roles: [ROLES_NAME_MAP.SUPER_ADMIN]
            }
          })
        ])
      })
      .then(_ => {
        done()
      })
      .catch(err => {
        done(err)
      })
    })

  })

})