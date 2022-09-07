require('module-alias/register')
const { expect } = require('chai')
const { get } = require('lodash')
const { UserModel, ScreenModal, sleep } = require('@src/utils')
const { ScreenPoolUtil, MAX_WAITING_LIVE_TIME } = require('@src/router/screen/router/save-pool/component-util/history')
const { Request, mockCreateUser, mockCreateScreen, deepParseResponse } = require('@test/utils')
const { MOCK_SCREEN_DATA } = require('./utils')

const COMMON_API = '/api/screen/list/pool'
const COMMON_API_DELETE = '/api/screen/list/pool/close'

describe(`${COMMON_API} test`, () => {

  let userInfo
  let screenId
  let selfToken
  let getToken

  before(function(done) {

    const { model, signToken } = mockCreateUser({
      username: COMMON_API
    }, {
      expiresIn: '100s'
    })

    getToken = signToken

    model.save()
    .then((user) => {
      userInfo = user
      selfToken = getToken(userInfo._id)

      const { model } = mockCreateScreen({
        name: COMMON_API,
        user: userInfo._id,
        data: JSON.stringify(MOCK_SCREEN_DATA),
        enable: false 
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
  
  describe(`post the screen pool success test -> ${COMMON_API}`, function() {

    it(`post the screen pool success`, function(done) {

      Request
      .post(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        type: 'screen',
       _id: screenId.toString() 
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .then(function(res) {
        expect(ScreenPoolUtil.isOvertime(screenId.toString())).to.be.false
      })
      .then(_ => {
        done()
      })
      .catch(err => {
        done(err)
      })

    })

    it(`post the screen pool success and exists the memo and check valid time is overtime`, (done) => {
      ScreenPoolUtil.clear(true)
      Request
      .post(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        type: 'screen',
       _id: screenId.toString() 
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .then(function(res) {
        expect(ScreenPoolUtil.isOvertime(screenId.toString())).to.be.false
      })
      .then(() => {
        return sleep(MAX_WAITING_LIVE_TIME + 1000)
      })
      .then(() => {
        expect(ScreenPoolUtil.isCheckTimestampsOvertime(screenId.toString())).to.be.true
      })
      .then(() => {
        return Request
        .post(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .send({
          type: 'screen',
         _id: screenId.toString() 
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .then(function(res) {
          expect(ScreenPoolUtil.isOvertime(screenId.toString())).to.be.false
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

  describe(`post the screen pool fail test -> ${COMMON_API}`, function() {

    it(`post the screen pool fail because the id is not valid`, function(done) {

      Request
      .post(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        _id: screenId.toString().slice(1),
        type:'screen'
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

    it(`post the screen pool fail because the id is not found`, function(done) {

      const id = screenId.toString()

      Request
      .post(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
       _id: `${(id.slice(0, 1) + 4) % 10}${id.slice(1)}`,
       type:'screen'
      })
      .expect(404)
      .expect('Content-Type', /json/)
      .then(_ => {
        done()
      })
      .catch(err => {
        done(err)
      })

    })

    it(`post the screen pool fail because the type is not valid`, (done) => {
      Request
      .post(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        _id: screenId.toString(),
        type:'scree'
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

    it(`post the screen pool fail because exists the save memo`, (done) => {
      ScreenPoolUtil.clear(true)
      Request
      .post(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        type: 'screen',
       _id: screenId.toString() 
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .then(function(res) {
        expect(ScreenPoolUtil.isOvertime(screenId.toString())).to.be.false
      })
      .then(() => {
        return Request
        .post(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .send({
          type: 'screen',
         _id: screenId.toString() 
        })
        .expect(400)
        .expect('Content-Type', /json/)
      })
      .then(_ => {
        done()
      })
      .catch(err => {
        done(err)
      })
    })

  })

  describe(`get the screen live success test -> ${COMMON_API}`, () => {

    it(`get the screen live success`, (done) => {
      ScreenPoolUtil.clear(true)

      Request
      .post(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        type: 'screen',
       _id: screenId.toString() 
      })
      .expect(200)
      .then(_ => {
        return Request
        .get(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .query({
          _id: screenId.toString(),
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .then(res => {
          const result = deepParseResponse(res)
          expect(result).to.be.true
        })
      })
      .then(() => {
        done()
      })
      .catch(err => {
        done(err)
      })
    })

    it(`get the screen live success and is overtime`, (done) => {
      ScreenPoolUtil.clear(true)

      Request
      .post(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        type: 'screen',
       _id: screenId.toString() 
      })
      .expect(200)
      .then(() => {
        return sleep(MAX_WAITING_LIVE_TIME + 1000)
      })
      .then(_ => {
        return Request
        .get(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .query({
          _id: screenId.toString(),
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .then(res => {
          const result = deepParseResponse(res)
          expect(result).to.be.false
        })
      })
      .then(() => {
        done()
      })
      .catch(err => {
        done(err)
      })
    })

  })

  describe(`put the screen live success test -> ${COMMON_API}`, () => {

    before((done) => {
      ScreenPoolUtil.clear(true)
      Request
      .post(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        type: 'screen',
       _id: screenId.toString() 
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

    it(`put the screen live success and save callback`, (done) => {
      const prevCallback = get(MOCK_SCREEN_DATA, 'components.config.attr.filter')
      const newCallback = [
        ...prevCallback.slice(0, -1),
        {
          ...prevCallback[prevCallback.length - 1],
          name: COMMON_API
        }
      ]

      Request
      .put(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        _id: screenId.toString(),
        type: 'callback',
        action: newCallback
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .then(res => {
        return ScreenModal.findOne({
          _id: screenId,
        })
        .select({
          data: 1
        })
        .exec()
        .then(value => {
          const { data } = value
          const result = JSON.parse(data)
          const currCallback = get(result, 'config.attr.filter')
          const [ callback ] = currCallback.slice(-1)
          expect(callback.name).to.be.equal(COMMON_API)
          done()
        })
      })
      .catch(err => {
        done(err)
      })

    })

    it(`put the screen live success and save guideLine`, (done) => {
      const prevGuideLine = get(MOCK_SCREEN_DATA, 'components.config.attr.guideLine')
      const newGuideLine = {
        show: true,
        value: [
          ...prevGuideLine.value.slice(0, -1),
          {
            ...prevGuideLine.value[prevGuideLine.value.length - 1],
            type: 'dashed'
          }
        ]
      }

      Request
      .put(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        _id: screenId.toString(),
        type: 'guideLine',
        action: newGuideLine
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .then(res => {
        return ScreenModal.findOne({
          _id: screenId,
        })
        .select({
          data: 1
        })
        .exec()
        .then(value => {
          const { data } = value
          const result = JSON.parse(data)
          const currGuideLine = get(result, 'config.attr.guideLine')
          const [ guideLine ] = currGuideLine.value.slice(-1)
          expect(guideLine.type).to.be.equal('dashed')
          done()
        })
      })
      .catch(err => {
        done(err)
      })
    })

    it(`put the screen live success and save undo`, (done) => {
      const prevGuideLine = get(MOCK_SCREEN_DATA, 'components.config.attr.guideLine')
      const newGuideLine = {
        ...prevGuideLine,
        show: false 
      }

      Request
      .put(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        _id: screenId.toString(),
        type: 'guideLine',
        action: newGuideLine
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .then(() => {
        return ScreenModal.findOne({
          _id: screenId,
        })
        .select({
          data: 1
        })
        .exec()
        .then(value => {
          const { data } = value
          const result = JSON.parse(data)
          const currGuideLine = get(result, 'config.attr.guideLine')
          expect(currGuideLine.show).to.be.false 
        })
      })
      .then(() => {
        return Request
        .put(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .send({
          _id: screenId.toString(),
          type: 'undo'
        })
        .expect(200)
        .expect('Content-Type', /json/)
      })
      .then(() => {
        return ScreenModal.findOne({
          _id: screenId,
        })
        .select({
          data: 1
        })
        .exec()
        .then(value => {
          const { data } = value
          const result = JSON.parse(data)
          const currGuideLine = get(result, 'config.attr.guideLine')
          expect(currGuideLine.show).to.be.true 
          done()
        })
      })
      .catch(err => {
        done(err)
      })
    })

    it(`put the screen live success and save redo`, (done) => {
      const prevGuideLine = get(MOCK_SCREEN_DATA, 'components.config.attr.guideLine')
      const newGuideLine = {
        ...prevGuideLine,
        show: false 
      }

      Request
      .put(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        _id: screenId.toString(),
        type: 'guideLine',
        action: newGuideLine
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .then(() => {
        return Request
        .put(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .send({
          _id: screenId.toString(),
          type: 'undo'
        })
        .expect(200)
        .expect('Content-Type', /json/)
      })
      .then(() => {
        return Request
        .put(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .send({
          _id: screenId.toString(),
          type: 'redo'
        })
        .expect(200)
        .expect('Content-Type', /json/)
      })
      .then(() => {
        return ScreenModal.findOne({
          _id: screenId,
        })
        .select({
          data: 1
        })
        .exec()
        .then(value => {
          const { data } = value
          const result = JSON.parse(data)
          const currGuideLine = get(result, 'config.attr.guideLine')
          expect(currGuideLine.show).to.be.false 
          done()
        })
      })
      .catch(err => {
        done(err)
      })
    })

    it(`put the screen live success and move components`, (done) => {
      done()
    })

    it(`put the screen live success and group components`, (done) => {
      done()
    })

    it(`put the screen live success and ungroup components`, (done) => {
      done()
    })

    it(`put the screen live success and screen config update`, (done) => {
      done()
    })

  })

  describe(`put the screen live success test -> ${COMMON_API}`, () => {

    before((done) => {
      ScreenPoolUtil.clear(true)
      Request
      .post(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        type: 'screen',
       _id: screenId.toString() 
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

    it('put the screen live fail because the type is not valid', (done) => {
      Request
      .put(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        _id: screenId.toString(),
        type:''
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
    
    it('put the screen live fail because lack of the action', (done) => {
      Request
      .put(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        _id: screenId.toString(),
        type:'components'
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

    it('put the screen live fail because overtime', (done) => {

      ScreenPoolUtil.clear(true)
      Request
      .put(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        _id: screenId.toString(),
        type:'undo'
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

  describe(`delete the screen save pool success test -> ${COMMON_API_DELETE}`, () => {

    it(`delete the screen save pool success`, (done) => {
      Request
      .post(COMMON_API_DELETE)
      .send({
        _id: screenId.toString(),
        user: userInfo._id,
        type: 'screen'
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .then(res => {
        expect(ScreenPoolUtil.isExists(screenId.toString())).to.be.false
      })
      .then(() => {
        done()
      })
      .catch(err => {
        done(err)
      })
    })

  })

})