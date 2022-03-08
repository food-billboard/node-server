require('module-alias/register')
const { UserModel } = require('@src/utils')
const { Request, commonValidate, mockCreateUser, parseResponse } = require('@test/utils')

const COMMON_API = '/api/manage/movie/detail/douban'

function responseExpect(res, validate=[]) {
  const { res: { data: target } } = res

  commonValidate.string(target)

  if(Array.isArray(validate)) {
    validate.forEach(valid => {
      typeof valid == 'function' && valid(target)
    })
  }else if(typeof validate === 'function') {
    validate(target)
  }
}

// mocha ./test/manage/movie/detail/douban/index.test.js --timeout 200000

describe.skip(`${COMMON_API} test`, function() {

  let selfToken
  let userInfo
  const MOVIE_ID = '34874432'

  before(function(done) {

    const { model: user, signToken } = mockCreateUser({
      username: COMMON_API
    }, {
      expiresIn: '120s'
    })

    user.save()
    .then((user) => {
      userInfo = user
      selfToken = signToken(userInfo._id)
    })
    .then(function() {
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
    .then(function() {
      done()
    })
    .catch(err => {
      done(err)
    })

  })

  describe(`${COMMON_API} success test`, function() {

    describe(`get movie success test -> ${COMMON_API}`, function() {
      it(`get the movie for douban success`, function(done) {

        Request
        .get(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .query({
          id: MOVIE_ID,
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if(err) return done(err)
          let obj = parseResponse(res)
          responseExpect(obj)
          done()
        })
  
      })
  
    })

  })

  describe(`${COMMON_API} fail test`, function() {
    
    describe(`get movie fail test -> ${COMMON_API}`, function() {

      it(`get the movie for douban fail because the movie id is not verify`, function(done) {

        Request
        .get(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .query({
          id: ''
        })
        .expect(400)
        .expect('Content-Type', /json/)
        .end(function(err) {
          if(err) return done(err)
          done()
        })
  
      })

    })

  })

})