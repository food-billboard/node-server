require('module-alias/register')
const { UserModel, SCHEDULE_STATUS, ScheduleModel } = require('@src/utils')
const { expect } = require('chai')
const { Request, commonValidate, parseResponse, mockCreateUser } = require('@test/utils')

const COMMON_API = '/api/manage/schedule'

const COMMON_TIME_API = '/api/manage/schedule/time'

const COMMON_RESUME_API = '/api/manage/schedule/resume'

function responseExpect(res, validate=[]) {
  const { res: { data: target } } = res

  expect(target).to.be.a('array')
  target.forEach(item => {
    expect(item).to.be.a('object').and.that.include.any.keys('name', 'time', 'status', "description")

    commonValidate.string(item.name)
    commonValidate.string(item.description)
    commonValidate.string(item.time)
    commonValidate.string(item.status)

  })

  if(Array.isArray(validate)) {
    validate.forEach(valid => {
      typeof valid == 'function' && valid(target)
    })
  }else if(typeof validate === 'function') {
    validate(target)
  }
}

describe(`${COMMON_API} test`, function() {

  let userInfo 
  let selfToken
  let getToken
  let scheduleId

  before(function(done) {

    const { model, signToken } = mockCreateUser({
      username: COMMON_API,
    })

    getToken = signToken

    model.save()
    .then(data => {
      userInfo = data
      selfToken = getToken(userInfo._id)
    })
    .then(_ => {
      return new Promise(resolve => setTimeout(resolve, 1000))
    })
    .then(_ => {
      return ScheduleModel.findOne({})
      .select({
        _id: 1,
      })
      .exec() 
    })
    .then(data => {
      scheduleId = data._id 
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

  describe(`${COMMON_API} success test`, function() {

    describe(`get schedule list success -> ${COMMON_API}`, function() {

      it(`get schedule list success`, function(done) {

        Request
        .get(COMMON_API)
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if(err) return done(err)
          let obj = parseResponse(res)
          responseExpect(obj, target => {
            expect(target.length).to.not.be.equals(0)
          })
          done()
        })

      })

    })

    describe(`post schedule deal immediately success test -> ${COMMON_API}`, function() {

      it(`post schedule deal immediately success`, function(done) {

        Request
        .post(COMMON_API)
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .send({
          _id: scheduleId.toString(),
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if(err) return done(err)
          done()
        })

      })

    })

    describe(`change the schedule deal time success test -> ${COMMON_TIME_API}`, function() {

      let targetName
      const newTime = "* * * * * 2"
      let prevTime 

      before(function(done) {

        ScheduleModel.findOne({
          _id: scheduleId
        })
        .select({
          time: 1,
          name: 1 
        })
        .exec()
        .then(data => {
          prevTime = data.time 
          targetName = data.name 
        })
        .then(_ => {
          done() 
        })
        .catch(err => {
          done(err)
        })

      })

      after(function(done) {

        ScheduleModel.findOne({
          _id: scheduleId
        })
        .select({
          time: 1,
          status: 1 
        })
        .exec()
        .then(data => {
          const { time, status } = data 
          expect(time).to.be.equal(newTime)
          expect(status).to.be.equal(SCHEDULE_STATUS.SCHEDULING)
          return ScheduleModel.updateOne({
            _id: scheduleId
          }, {
            $set: {
              time: prevTime
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

      it(`change the schedule deal time success`, function(done) {

        Request
        .put(COMMON_TIME_API)
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .send({
          _id: scheduleId.toString(),
          time: newTime
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if(err) return done(err)
          done()
        })

      })

    })

    describe(`cancel the schedule deal success test -> ${COMMON_API}`, function() {

      let targetName

      before(function(done) {

        ScheduleModel.findOne({
          _id: scheduleId
        })
        .select({
          name: 1,
          status: 1 
        })
        .exec()
        .then(data => {
          targetName = data.name 
        })
        .then(() => {
          done() 
        })
        .catch(err => {
          done(err)
        })

      })

      after(function(done) {

        ScheduleModel.findOne({
          _id: scheduleId  
        })
        .select({
          status: 1 
        })
        .exec() 
        .then(data => {
          expect(data.status).to.be.equal(SCHEDULE_STATUS.CANCEL)
          return Request
          .put(COMMON_API)
          .set({
            Accept: 'Application/json',
            Authorization: `Basic ${selfToken}`
          })
          .send({
            _id: scheduleId.toString(),
          })
          .expect(200)
          .expect('Content-Type', /json/)
        })
        .then(function() {
          done()
        })
        .catch(err => {
          done(err)
        })

      })

      it(`cancel the schedule deal success`, function(done) {

        Request
        .delete(COMMON_API)
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .query({
          _id: scheduleId.toString(),
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if(err) return done(err)
          done()
        })

      })

    })

    describe(`restart the schedule deal success test test -> ${COMMON_API}`, function() {

      let targetName

      before(function(done) {

        Request
        .delete(COMMON_API)
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .query({
          _id: scheduleId.toString(),
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .then(data => {
          done() 
        })
        .catch(err => {
          done(err)
        })

      })

      after(function(done) {

        ScheduleModel.findOne({
          _id: scheduleId,
          status: SCHEDULE_STATUS.SCHEDULING 
        })
        .select({
          _id: 1
        })
        .exec() 
        .then(data => {
          expect(!!data).to.be.true
          done()  
        })
        .catch(err => {
          done(err)
        }) 

      })

      it(`restart the schedule deal success`, function(done) {

        Request
        .put(COMMON_API)
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .send({
          _id: scheduleId.toString(),
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if(err) return done(err)
          done()
        })

      })

    })

    describe.skip(`resume all schedule deal success test -> ${COMMON_RESUME_API}`, function() {

      it(`resume all schedule deal success`, function(done) {

        Request
        .post(COMMON_RESUME_API)
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if(err) return done(err)
          done()
        })

      })

    })

  })

  describe(`${COMMON_API} fail test`, function() {

    describe(`post schedule deal immediately fail test -> ${COMMON_API}`, function() {

      it(`post schedule deal immediately fail because the _id is not exists`, function(done) {

        Request
        .post(COMMON_API)
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .send({
          _id: "8f63270f005f1c1a0d9448ca"
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

    })

    describe(`restart the schedule deal fail test -> ${COMMON_API}`, function() {

      it(`restart the schedule deal fail because the _id is not exists`, function(done) {
        
        Request
        .put(COMMON_API)
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .send({
          _id: "8f63270f005f1c1a0d9448ca"
        })
        .expect(404)
        .expect('Content-Type', /json/)
        .then(data => {
          done()
        })
        .catch(err => {
          done(err)
        })

      })

    })

    describe(`cancel the schedule deal fail test -> ${COMMON_API}`, function() {

      it(`cancel the schedule deal fail because the _id is not exists`, function(done) {

        Request
        .delete(COMMON_API)
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .query({
          _id: "8f63270f005f1c1a0d9448ca"
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

    })

    describe(`change the schedule deal time fail test -> ${COMMON_TIME_API}`, function() {

      let targetName 
      let targetTime 

      before((done) => {

        ScheduleModel.findOne({
          _id: scheduleId.toString() 
        })
        .select({
          time: 1,
          name: 1 
        })
        .exec() 
        .then(data => {
          const { time, name } = data

          targetName = name 
          targetTime = time 
          done()
        })
        .catch(err => {
          done(err)
        })

      })

      it(`change the schedule deal time fail because the _id is not exists`, function(done) {
        
        Request
        .put(COMMON_TIME_API)
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .send({
          _id: "8f63270f005f1c1a0d9448ca",
          time: "* * * * * 3"
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

      it(`change the schedule deal time fail because the time is not valid`, function(done) {
        
        Request
        .put(COMMON_TIME_API)
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .send({
          _id: scheduleId.toString(),
          time: "* * * * * *"
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

      it(`change the schedule deal time fail because the time is exists`, function(done) {
        
        Request
        .put(COMMON_TIME_API)
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .send({
          _id: scheduleId.toString(),
          time: targetTime
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

})