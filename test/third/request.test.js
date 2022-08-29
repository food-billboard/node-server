require('module-alias/register')
const { UserModel, ThirdPartyModel, THIRD_PARTY_REQUEST_PARAMS_TYPE } = require('@src/utils')
const { Request, mockCreateUser, mockCreateThird } = require('@test/utils')

const COMMON_API = '/api/third/request'

describe(`${COMMON_API} test`, () => {

  let userInfo
  let selfToken
  let thirdId 
  let getToken

  const commonParams = {
    a: 1,
    b: {
      c: 20,
      d: [ 20 ]
    },
    f: [
      {
        e: '30'
      }
    ]
  }

  before(function(done) {

    const { model, signToken } = mockCreateUser({
      username: COMMON_API,
    })

    getToken = signToken

    model.save()
    .then((user) => {
      userInfo = user
      selfToken = getToken(userInfo._id)
      const { model } = mockCreateThird({
        name: COMMON_API,
        user: userInfo._id,
        params: [
          {
            name: 'a',
            data_type: THIRD_PARTY_REQUEST_PARAMS_TYPE.number 
          },
          {
            name: 'b',
            data_type: THIRD_PARTY_REQUEST_PARAMS_TYPE.object,
            children: [
              {
                name: 'c',
                data_type: THIRD_PARTY_REQUEST_PARAMS_TYPE.number 
              },
              {
                name: 'd',
                data_type: THIRD_PARTY_REQUEST_PARAMS_TYPE['normal-array'],
                children: [
                  {
                    name: 'e',
                    data_type: THIRD_PARTY_REQUEST_PARAMS_TYPE.number 
                  }
                ] 
              }
            ] 
          },
          {
            name: 'f',
            data_type: THIRD_PARTY_REQUEST_PARAMS_TYPE['object-array'],
            children: [
              {
                name: 'e',
                data_type: THIRD_PARTY_REQUEST_PARAMS_TYPE.string  
              }
            ] 
          }
        ]
      }) 
      return model.save()  
    })
    .then(data => {
      thirdId = data._id 
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
      ThirdPartyModel.deleteMany({
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
  
  describe(`get the third data success test -> ${COMMON_API}`, function() {

    it(`get the third data success`, function(done) {

      Request
      .post(COMMON_API)
      .set({
        Accept: 'application/json'
      })
      .send({
        _id: thirdId.toString(),
        params: commonParams
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .then(_ => {
        done()
      })
      .catch(err => {
        done(err)
      })

    })

  })

  describe(`get the third data fail test -> ${COMMON_API}`, function() {

    it(`get third data fail because the _id is not valid`, function(done) {
      Request
      .post(COMMON_API)
      .set({
        Accept: 'application/json'
      })
      .send({
        _id: '',
        params: commonParams
      })
      .expect(400)
      .expect('Content-Type', /json/)
      .then(_ => {
        done()
      })
      .catch(err => {
        done(err)
      })
    })

    it(`get third data fail because the _id is not valid`, function(done) {
      Request
      .post(COMMON_API)
      .set({
        Accept: 'application/json'
      })
      .send({
        _id: '',
        params: commonParams
      })
      .expect(400)
      .expect('Content-Type', /json/)
      .then(_ => {
        done()
      })
      .catch(err => {
        done(err)
      })
    })

  })

})