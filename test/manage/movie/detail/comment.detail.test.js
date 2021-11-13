require('module-alias/register')
const { UserModel, CommentModel, MovieModel, ImageModel, COMMENT_SOURCE_TYPE } = require('@src/utils')
const { expect } = require('chai')
const { Request, commonValidate, mockCreateUser, mockCreateMovie, mockCreateComment, mockCreateImage, parseResponse } = require('@test/utils')
const { Types: { ObjectId } } = require("mongoose")
const Day = require('dayjs')

const COMMON_API = '/api/manage/movie/detail/comment/detail'

function responseExpect(res, validate=[]) {
  const { res: { data: target } } = res

  expect(target).to.be.a('object').and.that.include.all.keys('total', 'list')
  commonValidate.number(target.total)
  expect(target.list).to.be.a('array')

  target.list.forEach(item => {
    expect(item).to.be.a('object').that.includes.all.keys('_id', 'user_info', 'comment_users', 'total_like', 'content', 'createdAt', 'updatedAt')
    commonValidate.objectId(item._id)
    expect(item.user_info).to.be.a('object').that.includes.any.keys('_id', 'username', "description", "avatar")
    commonValidate.string(item.user_info.username)
    commonValidate.string(item.user_info.description)
    if(item.user_info.avatar) commonValidate.string(item.user_info.avatar)
    commonValidate.objectId(item.user_info._id)
    commonValidate.number(item.comment_users)
    commonValidate.number(item.total_like)
    expect(item.content).to.be.a('object').and.that.includes.all.keys('text', 'image', 'video')
    commonValidate.string(item.content.text)
    expect(item.content.image).to.be.a('array')
    item.content.image.forEach(img => {
      commonValidate.poster(img)
    })
    expect(item.content.video).to.be.a('array')
    item.content.video.forEach(vi => commonValidate.poster(vi))
    commonValidate.date(item.createdAt)
    commonValidate.date(item.updatedAt)
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
  let imageId
  let movieId
  let oneCommentId
  let subCommentIdOne
  let subCommentIdTwo 

  before(function(done) {

    const { model: user, signToken } = mockCreateUser({
      username: COMMON_API
    })
    const { model: image } = mockCreateImage({
      src: COMMON_API
    })

    Promise.all([
      user.save(),
      image.save()
    ])
    .then(([user, image]) => {
      userInfo = user
      imageId = image._id
      selfToken = signToken(userInfo._id)

      const { model } = mockCreateMovie({
        name: COMMON_API
      })

      return model.save()

    })
    .then(data => {
      movieId = data._id

      const { model: one } = mockCreateComment({
        source_type: COMMENT_SOURCE_TYPE.movie,
        source: movieId,
        content: {
          text: COMMON_API,
          image: [ imageId ],
          video: []
        },
        user_info: userInfo._id,
        total_like: 10
      })

      return one.save()
    })
    .then(data => {
      oneCommentId = data._id
      const { model: one } = mockCreateComment({
        source_type: COMMENT_SOURCE_TYPE.comment,
        source: oneCommentId,
        content: {
          text: COMMON_API,
          image: [ imageId ],
          video: []
        },
        user_info: userInfo._id,
        total_like: 10,
        comment_users: [
          ObjectId("8f63270f005f1c1a0d9448ca")
        ]
      }) 
      const { model: two } = mockCreateComment({
        source_type: COMMENT_SOURCE_TYPE.comment,
        source: oneCommentId,
        content: {
          text: COMMON_API,
          image: [ imageId ],
          video: []
        },
        user_info: userInfo._id,
        total_like: 5,
      }) 
      return one.save()
      .then(data => {
        subCommentIdOne = data._id 
        return new Promise(resolve => setTimeout(resolve, 1000))
      })
      .then(data => {
        return two.save()
      })
    })
    .then(data => {
      subCommentIdTwo = data._id
      return Promise.all([
        MovieModel.updateOne({
          name: COMMON_API
        }, {
          $set: { comment: [ oneCommentId ] }
        }),
        CommentModel.updateOne({
          _id: oneCommentId
        }, {
          $set: {
            sub_comments: [
              subCommentIdOne,
              subCommentIdTwo
            ]
          }
        })
      ])
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
      CommentModel.deleteMany({
        "content.text": COMMON_API
      }),
      MovieModel.deleteMany({
        name: COMMON_API
      }),
      ImageModel.deleteMany({
        src: COMMON_API
      })
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
      it(`get the movie comment list success`, function(done) {

        Request
        .get(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .query({
          _id: oneCommentId.toString()
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if(err) return done(err)
          let obj = parseResponse(res)
          responseExpect(obj, target => {
            expect(target.list.length).to.not.be.equals(0)
          })
          done()
        })
  
      })
  
      it(`get the movie comment list with comment`, function(done) {
  
        Request
        .get(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .query({
          _id: oneCommentId.toString(),
          comment: -1
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if(err) return done(err)
          let obj = parseResponse(res)
          responseExpect(obj, (target) => {
            const { list } = target
            const { _id } = list[0]
            expect(subCommentIdOne.equals(_id)).to.be.true
          })
          done()
        })
  
      })
  
      it(`get the movie comment list with sort of hot`, function(done) {
  
        Request
        .get(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .query({
          _id: oneCommentId.toString(),
          hot: -1
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if(err) return done(err)
          let obj = parseResponse(res)
          responseExpect(obj, (target) => {
            const { list } = target
            const { _id } = list[0]
            expect(subCommentIdOne.equals(_id)).to.be.true
          })
          done()
        })
  
      })
  
      it(`get the movie comment list with sort of time`, function(done) {
  
        Request
        .get(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .query({
          _id: oneCommentId.toString(),
          time: -1
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if(err) return done(err)
          let obj = parseResponse(res)
          responseExpect(obj, (target) => {
            const { list } = target
            const { _id } = list[0]
            expect(subCommentIdTwo.equals(_id)).to.be.true
          })
          done()
        })
  
      })
  
      it(`get the movie comment list with sort of start_date`, function(done) {
  
        Request
        .get(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .query({
          _id: oneCommentId.toString(),
          start_date: Day(Date.now() + 1000 * 24 * 60 * 60).format('YYYY-MM-DD')
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if(err) return done(err)
          let obj = parseResponse(res)
          responseExpect(obj, (target) => {
            const { list } = target
            expect(list.length).to.be.equals(0)
  
          })
          done()
        })
  
      })
  
      it(`get the movie comment list with sort of end_date`, function(done) {
  
        Request
        .get(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .query({
          _id: oneCommentId.toString(),
          end_date: '2019-10-11'
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if(err) return done(err)
          let obj = parseResponse(res)
          responseExpect(obj, (target) => {
            const { list } = target
            expect(list.length).to.be.equals(0)
  
          })
          done()
        })
  
      })
    })

  })

  describe(`${COMMON_API} fail test`, function() {
    
    describe(`get comment fail test -> ${COMMON_API}`, function() {

      it(`get the movie comment list fail because the movie id is not verify`, function(done) {

        Request
        .get(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .query({
          _id: oneCommentId.toString().slice(1)
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

})