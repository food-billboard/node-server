require('module-alias/register')
const { scheduleConstructor, UserModel, SCHEDULE_STATUS } = require('@src/utils')
const CacheJson = require('@src/utils/schedule/cache.json')
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
          name: Object.keys(CacheJson)[0],
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
      const newTime = "* * * * * *"
      let prevTime 

      before(function(done) {
        const [ target ] = Object.values(CacheJson)

        const { name, time } = target

        targetName = name 
        prevTime = time

        done()

      })

      after(function(done) {

        const { time, status } = scheduleConstructor.getScheduleConfig(targetName) || {}

        expect(time).to.be.equal(newTime)
        expect(status).to.be.equal(SCHEDULE_STATUS.SCHEDULING)

        scheduleConstructor.setScheduleConfig(targetName, {
          time: prevTime
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
          name: targetName,
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
        const [ target ] = Object.values(CacheJson)

        const { name } = target
        
        const { status } = scheduleConstructor.getScheduleConfig(name) || {}

        expect(status).to.be.equals(SCHEDULE_STATUS.SCHEDULING)

        targetName = name 

        done()

      })

      after(function(done) {

        const { status } = scheduleConstructor.getScheduleConfig(targetName) || {}

        expect(status).to.be.equal(SCHEDULE_STATUS.CANCEL)

        scheduleConstructor.restartSchedule({ name: targetName })

        done()

      })

      it(`cancel the schedule deal success`, function(done) {

        Request
        .delete(COMMON_API)
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .query({
          name: targetName,
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
        const [ target ] = Object.values(CacheJson)

        const { name } = target

        targetName = name 

        scheduleConstructor.cancelSchedule({ name })

        const { status } = scheduleConstructor.getScheduleConfig(name)

        expect(status).to.be.equals(SCHEDULE_STATUS.CANCEL)

        done()

      })

      after(function(done) {

        const { status } = scheduleConstructor.getScheduleConfig(targetName) || {}

        expect(status).to.be.equal(SCHEDULE_STATUS.SCHEDULING)

        done()

      })

      it(`restart the schedule deal success`, function(done) {

        Request
        .put(COMMON_API)
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .send({
          name: targetName,
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if(err) return done(err)
          done()
        })

      })

    })

    describe(`resume all schedule deal success test -> ${COMMON_RESUME_API}`, function() {

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

      it(`post schedule deal immediately fail because the name is not exists`, function(done) {

        Request
        .post(COMMON_API)
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .send({
          name: ""
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

    describe(`restart the schedule deal fail test -> ${COMMON_API}`, function() {

      it(`restart the schedule deal fail because the name is not exists`, function(done) {
        
        Request
        .put(COMMON_API)
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .send({
          name: ""
        })
        .expect(400)
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

      it(`cancel the schedule deal fail because the name is not exists`, function(done) {

        Request
        .delete(COMMON_API)
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .query({
          name: ""
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

    describe(`change the schedule deal time fail test -> ${COMMON_TIME_API}`, function() {

      let targetName 
      let targetTime 

      before((done) => {

        const [ target ] = Object.values(CacheJson)
        const { time, name } = target

        targetName = name 
        targetTime = time 

        done()

      })

      it(`change the schedule deal time fail because the name is not exists`, function(done) {
        
        Request
        .put(COMMON_TIME_API)
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .send({
          name: "",
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

      it(`change the schedule deal time fail because the time is not valid`, function(done) {
        
        Request
        .put(COMMON_TIME_API)
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .send({
          name: "",
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
          name: targetName,
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