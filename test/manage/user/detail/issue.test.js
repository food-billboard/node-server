require('module-alias/register')
const { MovieModel, UserModel } = require('@src/utils')
const { expect } = require('chai')
const { Request, commonValidate, mockCreateMovie, mockCreateUser, mockCreateImage } = require('@test/utils')
const Day = require('dayjs')

const COMMON_API = '/api/manage/user/detail/issue'

function responseExpect(res, validate=[]) {
  const { res: { data: target } } = res

  expect(target).to.be.a('object').and.that.include.all.keys('total', 'list')
  commonValidate.number(target.total)
  expect(target.list).to.be.a('array')

  target.list.forEach(item => {
    expect(item).to.be.a('object').and.that.include.all.keys('_id', 'name', 'author', 'comment_count', 'total_rate', 'rate_person', 'createdAt', 'updatedAt', 'glance', 'hot', 'stauts', 'tag_count', 'barrage_count')
    commonValidate.objectId(item._id)
    commonValidate.string(item.name)
    expect(item.author).to.be.a('object').and.that.include.all.keys('_id', 'username')
    commonValidate.objectId(item.author._id)
    commonValidate.string(item.author.username)
    commonValidate.number(item.comment_count)
    commonValidate.number(item.total_rate)
    commonValidate.number(item.rate_person)
    commonValidate.date(item.createdAt)
    commonValidate.date(item.updatedAt)
    commonValidate.number(item.glance)
    commonValidate.number(item.hot)
    commonValidate.number(item.tag_count)
    commonValidate.number(item.barrage_count)
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
  let movieId
  let otherUserId
  let imageId

  before(function(done) {

    const { model: image } = mockCreateImage({
      src: COMMON_API
    })

    const { model: user, token } = mockCreateUser({
      username: COMMON_API
    })
    const { model: otherUser } = mockCreateUser({
      username: COMMON_API
    })
    selfToken = token

    Promise.all([
      user.save(),
      otherUser.save(),
      image.save()
    ])
    .then(([ user, otherUser, image ]) => {
      userInfo = user
      otherUserId = otherUser._id
      imageId = image._id

      const { model } = mockCreateMovie({
        name: COMMON_API,
        author: otherUserId,
        images: [ imageId ]
      })

      return model.save()
    })
    .then(data => {
      movieId = data._id
      return UserModel.updateOne({
        _id: otherUserId
      }, {
        $set: { issue: [ { _id: movieId, timestamps: Date.now() } ] }
      })
    })
    .then(_ => {
      done()
    })
    .catch(err => {
      console.log('oops: ', err)
    })

  })

  after(function(done) {

    Promise.all([
      MovieModel.deleteMany({
        name: COMMON_API
      }),
      UserModel.deleteMany({
        username: COMMON_API
      }),
      ImageModel.deleteMany({
        src: COMMON_API
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

    it(`get the movie list success`, function(done) {

      Request
      .get(COMMON_API)
      .query({
        _id: otherUserId.toString()
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
        responseExpect(obj)
        done()
      })

    })

    it(`get the movie list with end_date`, function(done) {

      Request
      .get(COMMON_API)
      .query({
        _id: otherUserId.toString(),
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
          expect(target.list.length).to.be.be(0)
        })
        done()
      })

    })

    it(`get the movie list with start_date`, function(done) {
      
      Request
      .get(COMMON_API)
      .query({
        _id: otherUserId.toString(),
        start_date: Day(Date.now() + 10000000).format('YYYY-MM-DD')
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
          expect(target.list.length).to.be(0)
        })
        done()
      })

    })

    it(`get the movie list with status`, function(done) {
      
      Request
      .get(COMMON_API)
      .query({
        _id: otherUserId.toString(),
        status: 'NOT_VERIFY'
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
          expect(target.list.length).to.be(0)
        })
        done()
      })

    })

  })

  describe(`${COMMON_API} fail test`, function() {
    
    it(`get the user issue list fail because the id is not found`, function() {

      const id = otherUserId.toString()

      Request
      .get(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
        _id: `${id.slice(0, -1)}${Math.ceil(10 / (parseInt(id.slice(-1)) + 5))}`,
      })
      .expect(404)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        done()
      })

    })

    it(`get the user issue list fail because the id is not verify`, function() {
      
      Request
      .get(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
        _id: otherUserId.toString().slice(1)
      })
      .expect(400)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        done()
      })

    })

    it(`get the user issue list fail because lack the id`, function(done) {
      
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