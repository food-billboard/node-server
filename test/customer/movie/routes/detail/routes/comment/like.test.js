require('module-alias/register')
const { expect } = require('chai')
const { 
  Request, 
  mockCreateUser,
  mockCreateComment,
} = require('@test/utils')
const { CommentModel } = require('@src/utils')
const { Types: { ObjectId } } = require('mongoose')

const COMMON_API = '/api/customer/movie/detail/comment/like'

describe(`${COMMON_API} test`, function() {

  let userDatabase
  let selfToken
  let userId
  let commentId

  before(function(done) {

    const { model, signToken } = mockCreateUser({
      username: COMMON_API
    })

    userDatabase = model

    userDatabase.save()
    .then(data => {
      userId = data._id
      selfToken = signToken(userId)
      const { model } = mockCreateComment({
        user_info: userId,
        source_type: 'comment',
        source: ObjectId('53102b43bf1044ed8b0ba36b'),
        content: {
          text: COMMON_API
        }
      })

      return model.save()
    })
    .then(function(data) {
      commentId = data._id
      done()
    })
    .catch(err => {
      console.log('oops: ', err)
    })

  })

  after(function(done) {

    Promise.all([
      CommentModel.deleteOne({
        "content.text": COMMON_API
      }),
      userDatabase.deleteOne({
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

  describe(`pre check the params of the comment id -> ${COMMON_API}`, function() {

    describe(`pre check the params of the comment id fail test -> ${COMMON_API}`, function() {

      it(`pre check the params of the comment id fail because the comment id is not found`, function(done) {

        const id = commentId.toString()

        Request
        .put(COMMON_API)
        .send({
          _id: `${(parseInt(id.slice(0, 1)) + 5) % 10}${id.slice(1)}`,
        })
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(404)
        .expect('Content-Type', /json/)
        .end(function(err) {
          if(err) return done(err)
          done()
        })

      })

      // it(`pre check the params of the comment id fail because the comment id is not verify`, function(done) {

      //   Request
      //   .put(COMMON_API)
      //   .send({
      //     _id: commentId.toString().slice(1),
      //   })
      //   .set({
      //     Accept: 'Application/json',
      //     Authorization: `Basic ${selfToken}`
      //   })
      //   .expect(400)
      //   .expect('Content-Type', /json/)
      //   .end(function(err) {
      //     if(err) return done(err)
      //     done()
      //   })

      // })

      // it(`pre check the params of the comment id fail because lack of the params of comment id`, function(done) {
        
      //   Request
      //   .put(COMMON_API)
      //   .set({
      //     Accept: 'Application/json',
      //     Authorization: `Basic ${selfToken}`
      //   })
      //   .expect(400)
      //   .expect('Content-Type', /json/)
      //   .end(function(err) {
      //     if(err) return done(err)
      //     done()
      //   })

      // })

    })

  })

  describe(`put like the comment test -> ${COMMON_API}`, function() {

    describe(`put like the comment success test -> ${COMMON_API}`, function() {

      before(function(done) {

        CommentModel.updateOne({
          _id: commentId
        },{
          total_like: 0,
          like_person: []
        })
        .then(function() {
          done()
        })
        .catch(err => {
          console.log('oops: ', err)
        })

      })

      after(async function() {
        
        const res = await CommentModel.findOne({
          _id: commentId,
        })
        .select({
          _id: 0,
          total_like: 1,
          like_person: 1
        })
        .exec()
        .then(data => !!data && data._doc)
        .then(data => {
          expect(data).to.be.not.a('boolean')
          return data.total_like == 1 && data.like_person.length == 1
        })
        .then(function(data) {
          expect(data).to.be.true
          return true
        })
        .catch(err => {
          console.log('oops: ', err)
          return false
        })

        return res ? Promise.resolve() : Promise.reject()

      })

      it(`put like the comment success test `, function(done) {

        Request
        .put(COMMON_API)
        .send({
          _id: commentId.toString()
        })
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err) {
          if(err) return done(err)
          done()
        })

      })

    })

    describe(`put like the comment fail test -> ${COMMON_API}`, function() {

      before(function(done) {

        CommentModel.updateOne({
          _id: commentId
        },{
          total_like: 1,
          like_person: [ userId ]
        })
        .then(function() {
          done()
        })
        .catch(err => {
          console.log('oops: ', err)
        })

      })

      after(async function() {
        
        const res = await CommentModel.findOne({
          "content.text": COMMON_API,
        })
        .select({
          _id: 0,
          total_like: 1,
          like_person: 1
        })
        .exec()
        .then(data => !!data && data._doc)
        .then(data => {
          expect(data).to.be.not.a('boolean')
          return data.total_like == 1 && data.like_person.length == 1
        })
        .then(function(data) {
          expect(data).to.be.true
          return true
        })
        .catch(err => {
          console.log('oops: ', err)
          return true
        })

        return res ? Promise.resolve() : Promise.reject()

      })

      it(`put like the comment fail because the user had already liked this comment`, function(done) {

        Request
        .put(COMMON_API)
        .send({
          _id: commentId.toString()
        })
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(403)
        .expect('Content-Type', /json/)
        .end(function(err) {
          if(err) return done(err)
          done()
        })

      })

    })

  })

  describe(`cancel like the comment test -> ${COMMON_API}`, function() {

    describe(`cancel like the comment success test -> ${COMMON_API}`, function() {

      before(function(done) {

        CommentModel.updateOne({
          _id: commentId
        },{
          like_person: [ userId ],
          total_like: 1
        })
        .then(function() {
          done()
        })
        .catch(err => {
          console.log('oops: ', err)
        })

      })

      after(async function() {
        
        const res = await CommentModel.findOne({
          "content.text": COMMON_API,
        })
        .select({
          _id: 0,
          like_person: 1,
          total_like: 1
        })
        .exec()
        .then(data => !!data && data._doc)
        .then(data => {
          expect(data).to.be.not.a('boolean')
          return data.like_person.length == 0 && data.total_like == 0
        })
        .then(function(data) {
          expect(data).to.be.true
          return true
        })
        .catch(err => {
          console.log('oops: ', err)
          return false
        })

        return res ? Promise.resolve() : Promise.reject()

      })

      it(`cancel like the comment success`, function(done) {

        Request
        .delete(COMMON_API)
        .query({
          _id: commentId.toString()
        })
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err) {
          if(err) return done(err)
          done()
        })

      })

    })

    describe(`cancel like the comment fail test -> ${COMMON_API}`, function() {

      before(function(done) {

        CommentModel.updateOne({
          "content.text": COMMON_API
        },{
          total_like: 0,
          like_person: []
        })
        .then(function() {
          done()
        })
        .catch(err => {
          console.log('oops: ', err)
        })

      })

      after(async function() {
        
        const res = await CommentModel.findOne({
          "content.text": COMMON_API,
        })
        .select({
          _id: 0,
          total_like: 1,
          like_person: 1
        })
        .exec()
        .then(data => !!data && data._doc)
        .then(data => {
          expect(data).to.be.not.a('boolean')
          return data.total_like == 0 && data.like_person.length == 0
        })
        .then(function(data) {
          expect(data).to.be.true
          return true
        })
        .catch(err => {
          console.log('oops: ', err)
          return false
        })

        return res ? Promise.resolve() : Promise.reject()

      })

      it(`cancel like the comment fail because the user is not like this comment before`, function(done) {
        
        Request
        .delete(COMMON_API)
        .query({
          _id: commentId.toString()
        })
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(403)
        .expect('Content-Type', /json/)
        .end(function(err) {
          if(err) return done(err)
          done()
        })

      })

    })

  })

})