require('module-alias/register')
const { MovieModel, ClassifyModel, UserModel } = require('@src/utils')
const { expect } = require('chai')
const { Request, commonValidate, mockCreateUser, mockCreateMovie, mockCreateClassify } = require('@test/utils')
const Day = require('dayjs')

const COMMON_API = '/api/manage/dashboard/search/type'

function responseExpect(res, validate=[]) {
  const { res: { data: target } } = res
  console.log(target)
  expect(target).to.be.a('object').and.that.include.all.keys('data', 'total')
  commonValidate.number(target.total)
  expect(target.data).to.be.a('array')
  target.data.forEach(item => {
    expect(item).to.be.a('object').and.that.include.all.keys('classify', 'count')
    expect(item.classify).to.be.a('object').and.that.include.all.keys('name', '_id')
    commonValidate.string(item.classify.name)
    expect(typeof item.classify._id === 'string' || item.classify._id == null).to.be.true
    let count = parseInt(item.count)
    commonValidate.number(count)
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
        responseExpect(obj)
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
        start_date: Day(Date.now() + 24 * 60 * 60 * 1000).format('YYYY-MM-DD')
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
        responseExpect(obj)
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
        responseExpect(obj)
        done()
      })

    })

  })

  // describe(`${COMMON_API_KEYWORD} fail test`, function() {
    
  // })

  // describe(`${COMMON_API_TYPE} fail test`, function() {
    
  // })

})