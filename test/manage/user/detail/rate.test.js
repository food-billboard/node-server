require('module-alias/register')
const { UserModel, MovieModel } = require('@src/utils')
const { expect } = require('chai')
const { Request, commonValidate, mockCreateUser, mockCreateMovie } = require('@test/utils')
const Day = require('dayjs')

const COMMON_API = '/api/manage/user/detail/rate'

function responseExpect(res, validate=[]) {
  const { res: { data: target } } = res

  expect(target).to.be.a('object').and.that.include.all.keys('total', 'list')
  commonValidate.number(target.total)
  expect(target.list).to.be.a('array')

  target.list.forEach(item => {
    expect(item).to.be.a('object').and.that.include.all.keys('value', 'createdAt', 'movie')
    commonValidate.number(item.value)
    commonValidate.date(item.createdAt)
    expect(item.movie).to.be.a('object').and.that.include.all.keys('_id', 'name', 'author_rate', 'rate_person', 'total_rate', 'source_type')
    commonValidate.objectId(item.movie._id)
    commonValidate.string(item.movie.name)
    commonValidate.number(item.movie.author_rate)
    commonValidate.number(item.movie.total_rate)
    commonValidate.number(item.movie.rate_person)
    commonValidate.string(item.movie.source_type)
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
  
  let selfToken
  let userInfo
  let movieId
  let getToken

  before(function(done) {

    const { model } = mockCreateMovie({
      name: COMMON_API
    })

    model.save()
    .then(data => {
      movieId = data._id

      const { model, signToken } = mockCreateUser({
        username: COMMON_API,
        rate: [
          {
            _id: movieId,
            rate: 10,
            timestamps: Date.now()
          }
        ]
      })
      
      getToken = signToken

      return model.save()
    })
    .then(function(data) {
      userInfo = data
      selfToken = getToken(userInfo._id)
      done()
    })
    .catch(err => {
      console.log('oops: ', err)
    })

  })

  after(function(done) {

    Promise.all([
      UserModel.deleteMany({
        username: COMMON_API
      }),
      MovieModel.deleteMany({
        name: COMMON_API
      })
    ])
    .then(function() {
      done()
    })
    .catch(err => {
      console.log('oops: ', err)
    })

  })

  describe(`${COMMON_API} success test`, function() {

    it(`get the rate list successs`, function(done) {

      Request
      .get(COMMON_API)
      .query({
        _id: userInfo._id.toString()
      })
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
        responseExpect(obj, target => {
          expect(target.list.length).to.not.be.equals(0)
        })
        done()
      })

    })

    it(`get the rate list with end_date`, function(done) {

      Request
      .get(COMMON_API)
      .query({
        _id: userInfo._id.toString(),
        end_date: '1970-11-1'
      })
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
        responseExpect(obj, target => {
          expect(target.list.length).to.be.equals(0)
        })
        done()
      })

    })

    it(`get the rate list with start_date`, function(done) {
      
      Request
      .get(COMMON_API)
      .query({
        _id: userInfo._id.toString(),
        start_date: Day(Date.now() + 1000 * 24 * 60 * 60).format('YYYY-MM-DD')
      })
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
        responseExpect(obj, target => {
          expect(target.list.length).to.be.equals(0)
        })
        done()
      })

    })

    it(`get the rate list with value`, function(done) {
      
      Request
      .get(COMMON_API)
      .query({
        _id: userInfo._id.toString(),
        value: 9
      })
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
        responseExpect(obj, target => {
          expect(target.list.length).to.be.equals(0)
        })
        done()
      })

    })

  })

  describe(`${COMMON_API} fail test`, function() {
    
    it(`get the user rate list fail because the id is not found`, function(done) {

      const id = userInfo._id.toString()

      Request
      .get(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
        _id: `${id.slice(1)}${Math.ceil(10 / (parseInt(id.slice(0, 1)) + 5))}`,
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
        responseExpect(obj, target => {
          expect(target.list.length).to.be.equals(0)
        })
        done()
      })

    })

    it(`get the user rate list fail because the id is not verify`, function(done) {
      
      Request
      .get(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
        _id: userInfo._id.toString().slice(1)
      })
      .expect(400)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        done()
      })

    })

    it(`get the user rate list fail because lack the id`, function(done) {
      
      Request
      .get(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .expect(400)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        done()
      })

    })

  })

})