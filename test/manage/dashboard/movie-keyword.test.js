require('module-alias/register')
const { SearchModel, UserModel } = require('@src/utils')
const { expect } = require('chai')
const { Request, commonValidate, mockCreateSearch, mockCreateUser } = require('@test/utils')

const COMMON_API = '/api/manage/dashboard/movie/keyword'

function responseExpect(res, validate=[]) {
  const { res: { data: target } } = res

  expect(target).to.be.a('object').and.that.include.all.keys('total', 'average', 'count_total_day', 'count_average_day', 'total_chart', 'average_chart', 'data')
  commonValidate.number(target.total)
  commonValidate.number(target.average)
  commonValidate.number(target.count_total_day)
  commonValidate.number(target.count_average_day)

  expect(target.total_chart).to.be.a('array')
  target.total_chart.forEach(item => {
    expect(item).to.be.a('object').and.that.include.all.keys('day', 'count')
    commonValidate.string(item.day)
    commonValidate.number(item.count)
  })
  expect(target.average_chart).to.be.a('array')
  target.average_chart.forEach(item => {
    expect(item).to.be.a('object').and.that.include.all.keys('day', 'count')
    commonValidate.string(item.day)
    commonValidate.number(item.count)
  })

  expect(target.data).to.be.a('array')
  target.data.forEach(item => {
    expect(item).to.be.a('object').and.that.include.all.keys('_id', 'key_word', 'count')
    commonValidate.string(item.key_word)
    commonValidate.number(item.count)
    commonValidate.objectId(item._id)
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
  let searchId

  before(function(done) {

    const { model: user, token } = mockCreateUser({
      username: COMMON_API
    })

    const { model: search } = mockCreateSearch({
      key_word: COMMON_API,
      hot: [
        new Date()
      ]
    })

    selfToken = token

    Promise.all([
      user.save(),
      search.save()
    ])
    .then(([user, search]) => {
      userInfo = user
      searchId = search._id
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
      SearchModel.deleteMany({
        key_word: COMMON_API
      })
    ])
    .then(data => {
      done()
    })
    .catch(err => {
      console.log('oops: ', err)
    })

  })

  describe(`${COMMON_API} success test`, function() {

    it(`get the keyword list success`, function(done) {

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

  })

  // describe(`${COMMON_API_KEYWORD} fail test`, function() {
    
  // })

  // describe(`${COMMON_API_TYPE} fail test`, function() {
    
  // })

})