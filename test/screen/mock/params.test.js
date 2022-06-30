require('module-alias/register')
const { expect } = require('chai')
const { ScreenMockModel } = require('@src/utils')
const { Request, mockCreateScreenMock, deepParseResponse } = require('@test/utils')

const COMMON_API = '/api/screen/mock/params'

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
  
  describe(`get the screen mock params success test -> ${COMMON_API}`, function() {

    it(`get the screen mock params success`, function(done) {

      Request
      .get(COMMON_API)
      .set({
        Accept: 'application/json'
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .then(data => {
        const value = deepParseResponse(data)

        expect(Array.isArray(value)).to.be.true 
        expect(value.some(item => item.data_kind === COMMON_API)).to.be.true 
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