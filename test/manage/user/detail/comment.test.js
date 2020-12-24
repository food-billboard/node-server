require('module-alias/register')
const { ImageModel, UserModel, CommentModel } = require('@src/utils')
const { expect } = require('chai')
const { Request, commonValidate, mockCreateImage, mockCreateUser, mockCreateComment } = require('@test/utils')
const { Types: { ObjectId } } = require("mongoose")
const Day = require('dayjs')

const COMMON_API = '/api/manage/user/detail/comment'

function responseExpect(res, validate=[]) {
  const { res: { data: target } } = res

  expect(target).to.be.a('object').and.that.include.all.keys('total', 'list')
  commonValidate.number(target.total)
  expect(target.list).to.be.a('array')

  target.list.forEach(item => {
    expect(item).to.be.a('object').that.includes.all.keys('_id', 'user_info', 'sub_comments', 'total_like', 'content', 'source_type', 'source', 'createdAt', 'updatedAt')
    commonValidate.objectId(item._id)
    expect(item.user_info).to.be.a('object').that.includes.all.keys('_id', 'username')
    commonValidate.number(item.sub_comments)
    commonValidate.number(item.total_like)
    expect(item.content).to.be.a('object').and.that.includes.all.keys('text', 'image', 'video')
    commonValidate.string(item.content.text)
    expect(item.content.image).to.be.a('array')
    item.content.image.forEach(img => commonValidate.poster(img))
    expect(item.content.video).to.be.a('array')
    item.content.video.forEach(vi => commonValidate.poster(vi))
    commonValidate.objectId(item.source)
    commonValidate.string(item.source_type)
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
  let otherUserId
  let imageId
  let oneCommentId
  let twoCommentId
  let threeCommentId

  before(function(done) {

    const { model: user, signToken } = mockCreateUser({
      username: COMMON_API
    })
    const { model: other } = mockCreateUser({
      username: COMMON_API,
      roles: [ 'CUSTOMER' ]
    })
    const { model: image } = mockCreateImage({
      src: COMMON_API,
    })

    Promise.all([
      user.save(),
      other.save(),
      image.save()
    ])
    .then(([user, other, image]) => {
      userInfo = user
      imageId = image._id
      otherUserId = other._id
      selfToken = signToken(userInfo._id)

      const { model: one } = mockCreateComment({
        source_type: 'movie',
        source: ObjectId('571094e2976aeb1df982ad4e'),
        content: {
          text: COMMON_API,
          image: [ imageId ],
          video: []
        },
        user_info: userInfo._id,
        total_like: 10
      })
      const { model: two } = mockCreateComment({
        source_type: 'movie',
        source: ObjectId('571094e2976aeb1df982ad4e'),
        content: {
          text: COMMON_API,
          image: [ imageId ],
          video: []
        },
        user_info: userInfo._id,
        total_like: 5,
        sub_comments: [ ObjectId('571094e2976aeb1df982ad4e') ]
      }) 

      const { model: three } = mockCreateComment({
        source_type: 'movie',
        source: ObjectId('571094e2976aeb1df982ad4e'),
        content: {
          text: COMMON_API,
          image: [ imageId ],
          video: []
        },
        user_info: otherUserId,
        total_like: 1
      }) 

      return Promise.all([
        one.save(),
        two.save(),
        three.save()
      ])

    })
    .then(([one, two, three]) => {
      oneCommentId = one._id
      twoCommentId = two._id
      threeCommentId = three._id
      return Promise.all([
        UserModel.updateOne({
          _id: userInfo._id
        }, {
          $set: { comment: [ oneCommentId, twoCommentId ] }
        }),
        UserModel.updateOne({
          _id: otherUserId
        }, {
          $set: { comment: [ threeCommentId ] }
        })
      ])
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
      UserModel.deleteMany({
        username: COMMON_API
      }),
      CommentModel.deleteMany({
        "content.text": COMMON_API
      }),
      ImageModel.deleteMany({
        src: COMMON_API
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

    describe(`get the user comment list success test -> ${COMMON_API}`, function() {

      it(`get the user comment list success`, function(done) {

        Request
        .get(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .query({
          _id: userInfo._id.toString()
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
  
      it(`get the user comment list with comment`, function(done) {
  
        Request
        .get(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .query({
          _id: userInfo._id.toString(),
          comment: -1
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
            const { list } = target
            const { _id } = list[0]
            expect(oneCommentId.equals(_id)).to.be.true
          })
          done()
        })
  
      })
  
      it(`get the user comment list with sort of like`, function(done) {
  
        Request
        .get(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .query({
          _id: userInfo._id.toString(),
          like: -1
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
            const { list } = target
            const { _id } = list[0]
            expect(oneCommentId.equals(_id)).to.be.true
          })
          done()
        })
  
      })
  
      it(`get the user comment list with sort of start_date`, function(done) {
  
        Request
        .get(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .query({
          _id: userInfo._id.toString(),
          start_date: Day(Date.now() + 1000 * 24 * 60 * 60).format('YYYY-MM-DD')
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
          _id: userInfo._id.toString(),
          end_date: '1970-10-11'
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
            const { list } = target
            expect(list.length).to.be.equals(0)
  
          })
          done()
        })
  
      })

    })

    describe(`delete the user comment success test -> ${COMMON_API}`, function() {

      after(function(done) {

        CommentModel.findOne({
          _id: threeCommentId
        })
        .select({
          _id: 1
        })
        .exec()
        .then(data => {
          expect(!!data).to.be.false
          done()
        })
        .catch(err => {
          console.log('oops: ', err)
          done(err)
        })

      })

      it(`delete the user comment success`, function(done) {

        Request
        .delete(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .query({
          _id: threeCommentId.toString()
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if(err) return done(err)
          done()
        })

      })

    })

  })

  describe(`${COMMON_API} fail test`, function() {
    
    describe(`get the user comment list fail test -> ${COMMON_API}`, function() {

      it(`get the user comment list fail because the movie id is not verify`, function(done) {

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

    })

    describe(`delete the user comment fail test -> ${COMMON_API}`, function() {

      it(`delete the user comment fail because the id is not verify`, function(done) {

        Request
        .get(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .query({
          _id: threeCommentId.toString().slice(1)
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