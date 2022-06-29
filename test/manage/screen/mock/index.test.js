require('module-alias/register')
const { expect } = require('chai')
const { Types: { ObjectId } } = require('mongoose')
const { ScreenMockModel } = require('@src/utils')
const { Request, mockCreateScreenMock, deepParseResponse } = require('@test/utils')

const COMMON_API = '/api/manage/screen/mock'

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
  
  describe(`get the screen mock data success test -> ${COMMON_API}`, function() {

    it(`get the screen mock data success`, function(done) {

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

    it(`get the screen mock data success with total`, function(done) {

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

    it(`get the screen mock data success with random`, function(done) {

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

  describe(`get the screen mock data fail test -> ${COMMON_API}`, function() {

    it(`copy screen model fail because the fields is not valid`, function(done) {
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
      .expect('Content-Type', /json/)
      .then(_ => {
        done()
      })
      .catch(err => {
        done(err)
      })
    })

  })

  describe(`delete the screen mock data success test -> ${COMMON_API}`, function() {

    it('delete the screen mock data success', function(done) {

    })

  })

  describe(`delete the screen mock data fail test -> ${COMMON_API}`, function() {
    
    it('delete the screen mock data fail because the id is not found', function(done) {

    })

    it('delete the screen mock data fail because the id is not valid', function(done) {

    })

    it('delete the screen mock data fail because lack of the id', function(done) {

    })

  })

  describe(`post the screen mock data success test -> ${COMMON_API}`, function() {
    
    it('delete the screen mock data success', function(done) {

    })

  })

  describe(`post the screen mock data fail test -> ${COMMON_API}`, function() {
    
  })

  describe(`put the screen mock data success test -> ${COMMON_API}`, function() {
    
  })

  describe(`post the screen mock data success test -> ${COMMON_API}`, function() {
    
  })

})