require('module-alias/register')
const { UserModel, MovieModel, BehaviourModel } = require('@src/utils')
const { expect } = require('chai')
const { Request, commonValidate, mockCreateUser, mockCreateMovie, mockCreateBehaviour } = require('@test/utils')
const { Types: { ObjectId } } = require("mongoose")
const Day = require('dayjs')

const COMMON_API_USER = '/api/manage/dashboard/statistics/user'
const COMMON_API_MOVIE = '/api/manage/dashboard/statistics/movie'
const COMMON_API_VISIT = '/api/manage/dashboard/statistics/visit'

function responseExpectUser(res, validate=[]) {
  const { res: { data: target } } = res

  expect(target).to.be.a('object').and.that.include.all.keys('data', 'rank')
  const { data, rank } = target
  expect(data).to.be.a('array')
  data.forEach(item => {
    expect(item).to.be.a('object').and.that.include.all.keys('day', 'count')
    commonValidate.string(item.day)
    commonValidate.number(item.count)
  })
  expect(rank).to.be.a('array')
  rank.forEach(item => {
    expect(item).to.be.a('object').and.that.include.all.keys('name', 'count', '_id', 'hot')
    commonValidate.string(item.name)
    commonValidate.number(item.count)
    commonValidate.string(item._id)
    commonValidate.number(item.hot)
  })

  if(Array.isArray(validate)) {
    validate.forEach(valid => {
      typeof valid == 'function' && valid(target)
    })
  }else if(typeof validate === 'function') {
    validate(target)
  }
}

function responseExpectMovie(res, validate=[]) {
  const { res: { data: target } } = res

  expect(target).to.be.a('object').and.that.include.all.keys('data', 'rank')
  const { data, rank } = target
  expect(data).to.be.a('array')
  data.forEach(item => {
    expect(item).to.be.a('object').and.that.include.all.keys('day', 'count')
    commonValidate.string(item.day)
    commonValidate.number(item.count)
  })
  expect(rank).to.be.a('array')
  rank.forEach(item => {
    expect(item).to.be.a('object').and.that.include.all.keys('name', 'count', '_id')
    commonValidate.string(item.name)
    commonValidate.number(item.count)
    commonValidate.string(item._id)
  })

  if(Array.isArray(validate)) {
    validate.forEach(valid => {
      typeof valid == 'function' && valid(target)
    })
  }else if(typeof validate === 'function') {
    validate(target)
  }
}

function responseExpectVisit(res, validate=[]) {
  const { res: { data: target } } = res

  expect(target).to.be.a('array')
  target.forEach(item => {
    expect(item).to.be.a('object').and.that.include.all.keys('day', 'count')
  })

  if(Array.isArray(validate)) {
    validate.forEach(valid => {
      typeof valid == 'function' && valid(target)
    })
  }else if(typeof validate === 'function') {
    validate(target)
  }
}

describe(`${COMMON_API_USER} and ${COMMON_API_MOVIE} and ${COMMON_API_VISIT} test`, function() {

  let selfToken

  before(function(done) {

    const { model:behaviour } = mockCreateBehaviour({
      user: ObjectId('8f63270f005f1c1a0d9448ca')
    })
    const { model: user, token } = mockCreateUser({
      username: COMMON_API_USER
    })
    const { model:movie } = mockCreateMovie({
      name: COMMON_API_USER,
      description: COMMON_API_USER
    })

    selfToken = token

    Promise.all([
      behaviour.save(),
      user.save(),
      movie.save()
    ])
    .then(data => {
      done()
    })
    .catch(err => {
      console.log('oops: ', err)
    })

  })

  after(function(done) {

    Promise.all([
      UserModel.deleteMany({
        username: COMMON_API_USER
      }),
      MovieModel.deleteMany({
        description: COMMON_API_USER
      }),
      BehaviourModel.deleteMany({
        user: ObjectId('8f63270f005f1c1a0d9448ca')
      })
    ])
    .then(data => {
      done()
    })
    .catch(err => {
      console.log('oops: ', err)
    })

  })

  describe(`${COMMON_API_USER} success test`, function() {

    it(`get register user statistics success`, function(done) {

      Request
      .get(COMMON_API_USER)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        const { res: { text } } = res
        let obj
        try{
          obj = JSON.parse(text)
        }catch(_) {
          console.log(_)
        }
        responseExpectUser(obj)
        done()
      })

    })

    it(`get register user statistics success with date_type`, function(done) {

      Request
      .get(COMMON_API_USER)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
        date_type: 'day'
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        const { res: { text } } = res
        let obj
        try{
          obj = JSON.parse(text)
        }catch(_) {
          console.log(_)
        }
        responseExpectUser(obj, target => {
          expect(target.data.length + target.rank.length).to.be(2)
        })
        done()
      })

    })

    it(`get register user statistics success with start_date`, function(done) {
      
      Request
      .get(COMMON_API_USER)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
        start_date: Day(Date.now() + 100000).format('YYYY-MM-DD')
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        const { res: { text } } = res
        let obj
        try{
          obj = JSON.parse(text)
        }catch(_) {
          console.log(_)
        }
        responseExpectUser(obj, target => {
          expect(target.data.length + target.rank.length).to.be(0)
        })
        done()
      })

    })

    it(`get register user statistics success with end_date`, function(done) {
      
      Request
      .get(COMMON_API_USER)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
        end_date: '1970-11-11'
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        const { res: { text } } = res
        let obj
        try{
          obj = JSON.parse(text)
        }catch(_) {
          console.log(_)
        }
        responseExpectUser(obj, target => {
          expect(target.data.length + target.rank.length).to.be(0)
        })
        done()
      })

    })

  })

  describe(`${COMMON_API_MOVIE} success test`, function() {

    it(`get movie statistics success`, function(done) {

      Request
      .get(COMMON_API_MOVIE)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        const { res: { text } } = res
        let obj
        try{
          obj = JSON.parse(text)
        }catch(_) {
          console.log(_)
        }
        responseExpectMovie(obj)
        done()
      })

    })

    it(`get movie statistics success with date_type`, function(done) {

      Request
      .get(COMMON_API_MOVIE)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
        date_type: 'day'
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        const { res: { text } } = res
        let obj
        try{
          obj = JSON.parse(text)
        }catch(_) {
          console.log(_)
        }
        responseExpectMovie(obj, target => {
          expect(target.data.length + target.rank.length).to.be(2)
        })
        done()
      })

    })

    it(`get movie statistics success with start_date`, function(done) {
      
      Request
      .get(COMMON_API_MOVIE)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
        start_date: Day(Date.now() + 100000).format('YYYY-MM-DD')
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        const { res: { text } } = res
        let obj
        try{
          obj = JSON.parse(text)
        }catch(_) {
          console.log(_)
        }
        responseExpectMovie(obj, target => {
          expect(target.data.length + target.rank.length).to.be(0)
        })
        done()
      })

    })

    it(`get movie statistics success with end_date`, function(done) {
      
      Request
      .get(COMMON_API_MOVIE)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
        end_date: '1970-11-11'
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        const { res: { text } } = res
        let obj
        try{
          obj = JSON.parse(text)
        }catch(_) {
          console.log(_)
        }
        responseExpectMovie(obj, target => {
          expect(target.data.length + target.rank.length).to.be(0)
        })
        done()
      })

    })

  })

  describe(`${COMMON_API_VISIT} success test`, function() {

    it(`get user visit statistics success`, function(done) {

      Request
      .get(COMMON_API_VISIT)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        const { res: { text } } = res
        let obj
        try{
          obj = JSON.parse(text)
        }catch(_) {
          console.log(_)
        }
        responseExpectVisit(obj)
        done()
      })

    })

    it(`get user visit statistics success with date_type`, function(done) {

      Request
      .get(COMMON_API_VISIT)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
        date_type: 'day'
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        const { res: { text } } = res
        let obj
        try{
          obj = JSON.parse(text)
        }catch(_) {
          console.log(_)
        }
        responseExpectVisit(obj, target => {
          expect(target.length).to.be(1)
        })
        done()
      })

    })

    it(`get user visit statistics success with start_date`, function(done) {
      
      Request
      .get(COMMON_API_VISIT)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
        start_date: Day(Date.now() + 100000).format('YYYY-MM-DD')
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        const { res: { text } } = res
        let obj
        try{
          obj = JSON.parse(text)
        }catch(_) {
          console.log(_)
        }
        responseExpectVisit(obj, target => {
          expect(target.length).to.be(0)
        })
        done()
      })

    })

    it(`get user visit statistics success with end_date`, function(done) {
      
      Request
      .get(COMMON_API_VISIT)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
        end_date: '1970-11-11'
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        const { res: { text } } = res
        let obj
        try{
          obj = JSON.parse(text)
        }catch(_) {
          console.log(_)
        }
        responseExpectVisit(obj, target => {
          expect(target.length).to.be(0)
        })
        done()
      })

    })

  })

  // describe(`${COMMON_API} fail test`, function() {
    
  // })

})