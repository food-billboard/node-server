require('module-alias/register')
const { UserModel, MovieModel, ImageModel } = require('@src/utils')
const { expect } = require('chai')
const { Request, commonValidate, mockCreateUser, mockCreateMovie, mockCreateImage } = require('@test/utils')
const Day = require('dayjs')

const COMMON_API = '/api/manage/movie/detail/user'

function responseExpect(res, validate=[]) {
  const { res: { data: target } } = res

  expect(target).to.be.a('object').and.that.include.all.keys('total', 'list')
  commonValidate.number(target.total)
  expect(target.list).to.be.a('array')

  target.list.forEach(item => {

    expect(item).to.be.a('object').and.that.includes.all.keys('movie_name', 'roles', 'glance_date', 'issue_count', 'status', 'username', 'mobile', 'email', 'hot', 'fans_count', 'attentions_count', 'createdAt', 'updatedAt', '_id')

    expect(item.roles).to.be.a('array')
    item.roles.forEach(role => commonValidate.string(role))
    commonValidate.number(item.mobile)
    commonValidate.string(item.email)
    commonValidate.string(item.status)
    commonValidate.string(item.movie_name)
    commonValidate.string(item.username)
    // commonValidate.poster(item.avatar)
    commonValidate.number(item.hot)
    commonValidate.number(item.fans_count)
    commonValidate.number(item.attentions_count)
    commonValidate.number(item.issue_count)
    commonValidate.date(item.glance_date)
    commonValidate.date(item.createdAt)
    commonValidate.date(item.updatedAt)
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
  let selfInfo
  let otherId
  let movieId
  let imageId
  let getToken

  before(function(done) {

    const { model: image } = mockCreateImage({
      src: COMMON_API
    })

    image.save()
    .then(image => {
      imageId = image._id

      const { model } = mockCreateMovie({
        name: COMMON_API
      })

      return model.save()

    })
    .then(data => {

      movieId = data._id

      const { model: self, signToken } = mockCreateUser({
        username: COMMON_API,
        avatar: imageId,
        glance: [
          {
            _id: movieId,
            timestamps: Date.now(),
          }
        ],
        status: 'SIGNOUT',
      })
      const { model: other } = mockCreateUser({
        username: COMMON_API,
        avatar: imageId,
        glance: [
          {
            _id: movieId,
            timestamps: Date.now() - 1000000,
          }
        ],
        status: 'SIGNIN',
        roles: [ 'CUSTOMER' ]
      })

      getToken = signToken

      return Promise.all([
        self.save(),
        other.save()
      ])

    })
    .then(([self, other]) => {
      selfInfo = self
      otherId = other._id
      selfToken = getToken(selfInfo._id)
    })
    .then(function() {
      done()
    })
    .catch(err => {
      console.log('oops: ', err)
    })

  })

  after(function(done) {

    Promise.all([
      ImageModel.deleteMany({
        src: COMMON_API
      }),
      MovieModel.deleteMany({
        name: COMMON_API
      }),
      UserModel.deleteMany({
        username: COMMON_API
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

    it(`get the visit movie user list success`, function(done) {

      Request
      .get(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
        _id: movieId.toString()
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

    it(`get the visit movie user list filter with start_date`, function(done) {

      Request
      .get(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
        _id: movieId.toString(),
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
        responseExpect(obj, (target) => {
          expect(target.list.length).to.be.equals(0)
        })
        done()
      })

    })

    it(`get the visit movie user list filter with end_date`, function(done) {

      Request
      .get(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
        _id: movieId.toString(),
        end_date: '1970-11-22'
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
        responseExpect(obj, (target) => {
          expect(target.list.length).to.be.equals(0)
        })
        done()
      })

    })

    it(`get the visit movie user list with filter of status`, function(done) {
      
      Request
      .get(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
        _id: movieId.toString(),
        status: 'SIGNIN'
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
        responseExpect(obj, (target) => {
          expect(target.list.length).to.be.equals(1)
        })
        done()
      })

    })

    it(`get the visit movie user list with filter of roles`, function(done) {
      
      Request
      .get(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
        _id: movieId.toString(),
        roles: 'CUSTOMER'
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
        responseExpect(obj, (target) => {
          expect(target.list.length).to.be.equals(1)
        })
        done()
      })

    })

  })

  describe(`${COMMON_API} fail test`, function() {
    
    it(`get the visit movie user list fail because the movie id is not verify`, function(done) {

      Request
      .get(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
        _id: movieId.toString().slice(1)
      })
      .expect(400)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        done()
      })

    })

    it(`get the visit movie user list fail because lack of the movie id `, function(done) {

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