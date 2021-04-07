require('module-alias/register')
const { mockCreateUser, mockCreateComment, mockCreateMovie, Request, createEtag, commonValidate } = require('@test/utils')
const { expect } = require('chai')
const mongoose = require('mongoose')
const { CommentModel, UserModel, MovieModel } = require('@src/utils')
const { Types: { ObjectId } } = mongoose

const COMMON_API = '/api/user/customer/comment'

function responseExpect(res, validate=[]) {

  const { res: { data: target } } = res

  expect(target).to.be.includes.all.keys('user_info', 'data')
  //user_info
  expect(target.user_info).is.a('object').and.to.be.includes.all.keys('avatar', '_id', 'username')
  commonValidate.poster(target.user_info.avatar)
  commonValidate.objectId(target.user_info._id)
  commonValidate.string(target.user_info.username)
  //data
  expect(target.data).is.a('array')
  target.data.forEach((item) => {
    expect(item).is.a('object').that.includes.all.keys('content', 'createdAt', 'source', 'total_like', '_id', 'updatedAt', 'like')
    //content
    expect(item).to.be.have.a.property('content').that.is.a('object').and.includes.all.keys('text', 'image', 'video')
    commonValidate.string(item.content.text)
    expect(item.content).to.have.a.property('image').that.is.a('array')
    expect(item.content).to.have.a.property('video').that.is.a('array')
    expect(item.content.image.every(media => typeof media === 'string')).to.be.true
    expect(item.content.video.every(media => typeof media === 'string')).to.be.true
    //createdAt
    commonValidate.time(item.createdAt)
    commonValidate.time(item.updatedAt)
    //source
    expect(item).have.a.property('source').that.is.a('object').and.includes.all.keys('type', 'content', 'updatedAt', '_id')
    commonValidate.objectId(item.source._id)
    // commonValidate.objectId(item.source.comment)
    commonValidate.string(item.source.type, function(target) {
      return !!~['movie', 'comment'].indexOf(target.toLowerCase())
    })
    expect(item.like).to.be.a('boolean')
    expect(item.source.content).to.be.satisfies(function(target) {
      return typeof target == 'string' || target == null
      return item.source.type.toLowerCase() == 'movie' ? target == null : typeof target === 'string'
    })
    //total_like
    commonValidate.number(item.total_like)
    //_id
    commonValidate.objectId(item._id)
  })
  
  if(Array.isArray(validate)) {
    validate.forEach(valid => {
      typeof valid == 'function' && valid(target)
    })
  }else if(typeof validate == 'function') {
    validate(target)
  }
}

describe(`${COMMON_API} test`, function() {

  describe(`get another user comment test -> ${COMMON_API}`, function() {

    let userResult
    let userId
    let movieId
    // let updatedAt
    let commentId

    before(function(done) {

      const { model: movie } = mockCreateMovie({
        name: COMMON_API
      })
      
      const { model } = mockCreateUser({
        username: COMMON_API
      })

      Promise.all([
        model.save(),
        movie.save()
      ])
      .then(function([user, movie]) {
        userResult = user
        userId = user._id
        movieId = movie._id
        const { model } = mockCreateComment({
          source_type: 'movie',
          source: movieId,
          user_info: userResult._id,
          content: {
            text: COMMON_API
          }
        })
        const { model: origin } = mockCreateComment({
          source_type: 'comment',
          source: ObjectId('56aa3554e90911b64c36a424'),
          user_info: userResult._id,
          content: {
            text: COMMON_API
          }
        })

        return Promise.all([
          model.save(),
          origin.save()
        ])
      })
      .then(([comment, origin]) => {
        commentId = comment._id
        return Promise.all([
          CommentModel.updateOne({
            user_info: userResult._id,
            source_type: 'comment',
          }, {
            source: comment._id
          }),
          CommentModel.updateOne({
            user_info: userResult._id,
            source_type: 'movie'
          }, {
            sub_comments: [origin._id]
          })
        ])
      })
      .then(function(_) {
        return UserModel.updateOne({
          username: COMMON_API
        }, {
          $push: { comment: commentId }
        })
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
        UserModel.deleteOne({
          username: COMMON_API
        }),
        CommentModel.deleteMany({
          "content.text": COMMON_API
        }),
        MovieModel.deleteMany({
          name: COMMON_API
        })
      ])
      .then(function() {
        done()
      })
      .catch(err => {
        console.log('oops: ', err)
      })
    })

    describe(`get another user comment success test -> ${COMMON_API}`, function() {

      // beforeEach(async function() {

      //   updatedAt = await UserModel.findOne({
      //     _id: userId
      //   })
      //   .select({
      //     _id: 0,
      //     updatedAt: 1
      //   })
      //   .exec()
      //   .then(data => {
      //     return data._doc.updatedAt
      //   })
      //   .catch(err => {
      //     console.log('oops: ', err)
      //     return false
      //   })

      //   return !!updatedAt ? Promise.resolve() : Promise.reject(COMMON_API)

      // })

      it(`get another user comment success`, function(done) {

        Request
        .get(COMMON_API)
        .set('Accept', 'application/json')
        .query({ _id: userId.toString() })
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

      // it(`get another user comment success and return the status of 304`, function(done) {

      //   const query = {
      //     _id: userId.toString()
      //   }

      //   Request
      //   .get(COMMON_API)
      //   .query(query)
      //   .set({
      //     'Accept': 'Application/json',
      //     'If-Modified-Since': updatedAt,
      //     'If-None-Match': createEtag(query)
      //   })
      //   .expect(304)
      //   .expect('Last-Modified', updatedAt.toString())
      //   .expect('ETag', createEtag(query))
      //   .end(function(err, _) {
      //     if(err) return done(err)
      //     done()
      //   })
      // })

    })

    describe(`get another user comment fail test -> ${COMMON_API}`, function() {
      
      it(`get another user comment fail because the user id is not found`, function(done) {

        const id = userId.toString()

        Request
        .get(COMMON_API)
        .query({'_id': `${(parseInt(id.slice(0, 1)) + 5) % 10}${id.slice(1)}`})
        .set('Accept', 'Application/json')
        .expect(404)
        .expect('Content-Type', /json/)
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

      it(`get another user comment fail because the user id is not verify`, function(done) {
        
        Request
        .get(COMMON_API)
        .query({'_id': userId.toString().slice(1)})
        .set('Accept', 'Application/json')
        .expect(400)
        .expect('Content-Type', /json/)
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

    })

  })

})