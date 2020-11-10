require('module-alias/register')
const { MovieModel, ClassifyModel, UserModel } = require('@src/utils')
const { expect } = require('chai')
const { Request, commonValidate, mockCreateUser, mockCreateMovie, mockCreateClassify } = require('@test/utils')
const Day = require('dayjs')

const COMMON_API = '/api/manage/dashboard/movie/type'

function responseExpect(res, validate=[]) {
  const { res: { data: target } } = res

  expect(target).to.be.a('array')
  target.forEach(item => {
    expect(item).to.be.a('item').and.that.include.all.keys('_id', 'name', 'value')
    commonValidate.objectId(item._id)
    commonValidate.string(item.name)
    commonValidate.number(value)
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
  let movieId
  let classifyId

  before(function(done) {

    const { model: user, token } = mockCreateUser({
      username: COMMON_API
    })
    const { model: classify } = mockCreateClassify({
      name: COMMON_API
    })
    selfToken = token

    Promise.all([
      user.save(),
      classify.save()
    ])
    .then(([user, classify]) => {
      userInfo = user
      classifyId = classify._id

      const { model } = mockCreateMovie({
        name: COMMON_API,
        info: {
          classify: [ classifyId ]
        }
      })

      return model.save()
    })
    .then(data => {
      movieId = data._id
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
      }),
      ClassifyModel.deleteMany({
        name: COMMON_API
      })
    ])
    .then(_ => {
      done()
    })
    .catch(err => {
      console.log('oops: ', err)
    })

  })

  describe(`${COMMON_API} success test`, function() {

    it(`get the type list success`, function(done) {

      Request
      .get(COMMON_API)
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

    it(`get the type list success with start_date`, function(done) {

      Request
      .get(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
        start_date: Day(Date.now() + 1000000).format('YYYY-MM-DD')
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
          expect(target.list.length).to.be(0)
        })
        done()
      })

    })

    it(`get the type list success with end_date`, function(done) {

      Request
      .get(COMMON_API)
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
          expect(target.list.length).to.be(0)
        })
        done()
      })

    })

  })

  // describe(`${COMMON_API_KEYWORD} fail test`, function() {
    
  // })

  // describe(`${COMMON_API_TYPE} fail test`, function() {
    
  // })

})