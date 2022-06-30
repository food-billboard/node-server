require('module-alias/register')
const { expect } = require('chai')
const { ScreenMockModel } = require('@src/utils')
const { Request, mockCreateScreenMock, deepParseResponse } = require('@test/utils')

const COMMON_API = '/api/screen/mock'

describe(`${COMMON_API} test`, () => {

  let mockId 
  const fieldKey = COMMON_API.split('/').join('')
  const mockData = new Array(4).fill(0).map((_, index) => `${COMMON_API}-${index}`)

  before(function(done) {

    const { model } = mockCreateScreenMock({
      data_kind: COMMON_API,
      mock_data: JSON.stringify(mockData)
    })

    model.save()
    .then(data => {
      mockId = data._id  
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
      ScreenMockModel.deleteMany({
        data_kind: COMMON_API
      })
    ])
    .then(_ => {
      done()
    })
    .catch(err => {
      done(err)
    })

  })
  
  describe(`get the screen mock data success test -> ${COMMON_API}`, function() {

    it(`get the screen mock data success`, function(done) {

      Request
      .post(COMMON_API)
      .set({
        Accept: 'application/json'
      })
      .send({
        fields: [
          {
            key: fieldKey,
            dataKind: mockId.toString()
          }
        ],
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .then(data => {
        const value = deepParseResponse(data)
        expect(value).to.be.a('array')
        expect(value.length).to.be.equals(1)
        expect(!!value[0][fieldKey]).to.be.true
      })
      .then(_ => {
        done()
      })
      .catch(err => {
        done(err)
      })

    })

    it(`get the screen mock data success with total`, function(done) {

      Request
      .post(COMMON_API)
      .set({
        Accept: 'application/json'
      })
      .send({
        fields: [
          {
            key: fieldKey,
            dataKind: mockId.toString()
          }
        ],
        total: 3 
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .then(data => {
        const value = deepParseResponse(data)
        expect(value).to.be.a('array')
        expect(value.length).to.be.equals(3)
      })
      .then(_ => {
        done()
      })
      .catch(err => {
        done(err)
      })

    })

    it(`get the screen mock data success with random`, function(done) {

      Request
      .post(COMMON_API)
      .set({
        Accept: 'application/json'
      })
      .send({
        fields: [
          {
            key: COMMON_API,
            dataKind: mockId.toString()
          }
        ],
        random: '1'
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .then(data => {
        const value = deepParseResponse(data)
        expect(value).to.be.a('array')
        expect(value.every((item, index) => {
          return item[COMMON_API] == mockData[index]
        })).to.be.false 
      })
      .then(_ => {
        done()
      })
      .catch(err => {
        done(err)
      })

    })

  })

  describe(`get the screen mock data fail test -> ${COMMON_API}`, function() {

    it(`copy screen model fail because the fields is not valid`, function(done) {
      Request
      .post(COMMON_API)
      .set({
        Accept: 'application/json'
      })
      .send({
        fields: [
          {
            key: COMMON_API,
            dataKind: mockId.toString().slice(1)
          }
        ]
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