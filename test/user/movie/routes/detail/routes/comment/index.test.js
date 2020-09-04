require('module-alias/register')
const { expect } = require('chai')
const { 
  mockCreateUser, 
  mockCreateComment, 
  mockCreateImage, 
  Request, 
  commonValidate,
  mockCreateMovie
} = require('@test/utils')
const mongoose = require('mongoose')
const { Types: { ObjectId } } = mongoose

const COMMON_API = '/api/user/movie/detail/comment'

function responseExpect(res, validate=[]) {

  const { res: { data: target } } = res 

  expect(target).to.be.a('array')

  target.forEach(item => {

    expect(item).to.be.a('object').and.that.includes.all.keys('content', 'user_info')
    expect(item.content).to.be.a('object').and.have.a.property('text').that.is.a('string')
    expect(item.user_info).to.be.a('object').that.have.a.property('avatar')
    commonValidate.poster(item.user_info.avatar)

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

  describe(`get the comment list in movie page test -> ${COMMON_API}`, function() {

    let imageDatabase
    let userDatabase
    let commentDatabase
    let movieDatabase
    let imageId
    let userId
    let movieId
    let result

    before(function(done) {

      const { model:image } = mockCreateImage({
        src: COMMON_API
      })
      imageDatabase = image
      imageDatabase.save()
      .then(data => {
        imageId = data._id
        const { model: user } = mockCreateUser({
          username: COMMON_API,
          avatar: imageId
        })
        userDatabase = user
        return userDatabase.save()
      })
      .then(user => {
        userId = user._id
        const { model } = mockCreateMovie({
          name: COMMON_API,
          author: userId
        })
        movieDatabase = model
        return movieDatabase.save()
      })
      .then(data => {
        movieId = data._id
        const { model } = mockCreateComment({
          source: movieId,
          user_info: userId,
          content: {
            text: COMMON_API
          }
        })
        commentDatabase = model
        return commentDatabase.save()
      })
      .then(data => {
        result = data
        return movieDatabase.updateOne({
          name: COMMON_API
        }, {
          $push: { 
            comment: movieId, 
          }
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
        imageDatabase.deleteOne({
          src: COMMON_API
        }),
        movieDatabase.deleteOne({
          name: COMMON_API
        }),
        userDatabase.deleteOne({
          username: COMMON_API
        }),
        commentDatabase.deleteOne({
          "content.text": COMMON_API
        }),
      ])
      .then(function() {
        done()
      })
      .catch(err => {
        console.log('oops: ', err)
      })

    })
    
    describe(`get the comment list in movie page success test -> ${COMMON_API}`, function() {

      it(`get the comment list in movie page success`, function(done) {

        Request
        .get(COMMON_API)
        .query({
          _id: result._id.toString()
        })
        .set({
          Accept: 'Application/json',
        })
        .expect(200)
        .expect({
          'Content-Type': /json/,
        })
        .end(function(err, _) {
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

      it(`get the comment list in movie page success and return the status of 304`, function(done) {

        const query = {
          _id: result._id.toString()
        }

        Request
        .get(COMMON_API)
        .query(query)
        .set({
          Accept: 'Application/json',
          'If-Modified-Since': result.updatedAt,
          'If-None-Match': createEtag(query)
        })
        .expect(304)
        .expect({
          'Content-Type': /json/,
          'Last-Modified': result.updatedAt,
          'ETag': createEtag(query)
        })
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

      it(`get the comment list in movie page success and hope return the status of 304 but the content has edited`, function(done) {

        const query = {
          _id: result._id.toString()
        }

        Request
        .get(COMMON_API)
        .query(query)
        .set({
          Accept: 'Application/json',
          'If-Modified-Since': new Date(Day(result.updatedAt).valueOf - 10000000),
          'If-None-Match': createEtag(query)
        })
        .expect(200)
        .expect({
          'Content-Type': /json/,
          'Last-Modified': result.updatedAt,
          'ETag': createEtag(query)
        })
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

      it(`get the comment list in movie page success and hope return the status of 304 but the params of query is change`, function(done) {

        const query = {
          offset: 0,
          _id: result._id.toString()
        }

        Request
        .get(COMMON_API)
        .query({
          _id: result._id.toString()
        })
        .set({
          Accept: 'Application/json',
          'If-Modified-Since': new Date(Day(result.updatedAt).valueOf - 10000000),
          'If-None-Match': createEtag(query)
        })
        .expect(200)
        .expect({
          'Content-Type': /json/,
          'Last-Modified': result.updatedAt,
          'ETag': createEtag(query)
        })
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

    })

    describe(`get the comment list in movie page fail test -> ${COMMON_API}`, function() {
      
      it(`get the comment list in movie page fail because the movie id is not found`, function(done) {

        const _id = result._id.toString()

        Request
        .get(COMMON_API)
        .query({
          _id: `${(parseInt(_id.slice(0, 1)) + 5) % 10}${_id.slice(1)}`
        })
        .set({
          Accept: 'Application/json'
        })
        .expect(404)
        .expect({
          'Content-Type': /json/
        })
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

      it(`get the comment list in movie page fail because the movie id is not verify`, function(done) {

        Request
        .get(COMMON_API)
        .query({
          _id: result._id.slice(1)
        })
        .set({
          Accept: 'Application/json'
        })
        .expect(400)
        .expect({
          'Content-Type': /json/
        })
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

      it(`get the comment list in movie page info fail because lack of the movie id`, function(done) {
        
        Request
        .get(COMMON_API)
        .set({
          Accept: 'Application/json'
        })
        .expect(400)
        .expect({
          'Content-Type': /json/
        })
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

    })

  })

})