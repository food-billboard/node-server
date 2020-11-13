require('module-alias/register')
const { UserModel, MovieModel, ClassifyModel, VideoModel, ImageModel } = require('@src/utils')
const { expect } = require('chai')
const { Request, commonValidate, mockCreateUser, mockCreateMovie, mockCreateClassify, mockCreateVideo, mockCreateImage } = require('@test/utils')

const COMMON_API = '/api/manage/movie/detail'

function responseExpect(res, validate=[]) {
  const { res: { data: target } } = res

  expect(target).to.be.a('object').and.that.includes.all.keys('_id', 'name', 'classify', 'images', 'poster', 'createdAt', 'updatedAt', 'glance', 'hot', 'rate_person', 'total_rate', 'source_type', 'status', 'barrage_count', 'tag_count', 'comment_count', 'author', 'video')
  commonValidate.objectId(target._id)
  commonValidate.string(target.name)
  expect(target.classify).to.be.a('array')
  target.classify.forEach(item => {
    commonValidate.string(item)
  })
  expect(target.images).to.be.a('array')
  target.images.forEach(item => {
    commonValidate.string(item)
  })
  commonValidate.poster(target.poster)
  commonValidate.date(target.createdAt)
  commonValidate.date(target.updatedAt)
  commonValidate.number(target.glance)
  commonValidate.number(target.hot)
  commonValidate.number(target.rate_person)
  commonValidate.number(target.total_rate)
  commonValidate.string(target.source_type)
  commonValidate.string(target.status)
  commonValidate.number(target.barrage_count)
  commonValidate.number(target.tag_count)
  commonValidate.number(target.comment_count)
  expect(target.author).to.be.a('object').and.that.includes.all.keys('_id', 'username')
  commonValidate.string(target.author.username)
  commonValidate.objectId(target.author._id)
  commonValidate.poster(target.video)

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
  let classId
  let imageId
  let videoId

  before(function(done) {

    const { model: user, token } = mockCreateUser({
      username: COMMON_API
    })

    const { model: classify } = mockCreateClassify({
      name: COMMON_API
    })

    const { model: video } = mockCreateVideo({
      src: COMMON_API
    })

    const { model: image } = mockCreateImage({
      src: COMMON_API
    })

    selfToken = token

    Promise.all([
      user.save(),
      classify.save(),
      video.save(),
      image.save()
    ])
    .then(([user, classify, video, image]) => {
      userInfo = user._id
      classId = classify._id
      videoId = video._id
      imageId = image._id

      const { model } = mockCreateMovie({
        name: COMMON_API,
        poster: imageId,
        images: new Array(6).fill(imageId),
        video: videoId,
        author: userInfo,
        info: {
          classify: [ classId ]
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
      ClassifyModel.deleteMany({
        name: COMMON_API
      }),
      MovieModel.deleteMany({
        name: COMMON_API
      }),
      ImageModel.deleteMany({
        src: COMMON_API
      }),
      VideoModel.deleteMany({
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

    it(`get the movie detail sucess`, function(done) {

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
        responseExpect(obj)
        done()
      })

    })

  })

  describe(`${COMMON_API} fail test`, function() {

    it(`pre check the movie id fail because the id is not verify`, function(done) {

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

    it(`pre check the movie id fail because the id is not found`, function(done) {

      let _id = movieId.toString()
      
      Request
      .get(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
        _id: `${_id.slice(0, -1)}${Math.ceil(10 / (parseInt(_id.slice(-1) + 5)))}`
      })
      .expect(404)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        done()
      })

    })

    it(`get the movie fail because lack of the movie id`, function(done) {

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