require('module-alias/register')
const { expect } = require('chai')
const { Types: { ObjectId } } = require('mongoose')
const { ScreenMockModel } = require('@src/utils')
const { Request, mockCreateScreenMock, deepParseResponse } = require('@test/utils')

const COMMON_API = '/api/screen/mock/params'

describe(`${COMMON_API} test`, () => {

  let mockId 

  before(function(done) {

    const { model } = mockCreateScreenMock({
      data_kind: COMMON_API
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
      .expect('Content-Type', /json/)
      .then(data => {
        const value = deepParseResponse(data)

        return ScreenModal.findOne({
          _id: ObjectId(value[0])
        })
        .select({
          _id: 1 
        })
        .exec() 
      })
      .then(data => {
        expect(!!data).to.be.true
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