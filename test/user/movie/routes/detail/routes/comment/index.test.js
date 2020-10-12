require('module-alias/register')
const { expect } = require('chai')
const { 
  mockCreateUser, 
  mockCreateComment, 
  mockCreateImage, 
  Request, 
  commonValidate,
  mockCreateMovie,
  createEtag
} = require('@test/utils')
const { MovieModel, ImageModel, CommentModel, UserModel } = require('@src/utils')
const Day = require('dayjs')

const COMMON_API = '/api/user/movie/detail/comment'

function responseExpect(res, validate=[]) {

  const { res: { data: target } } = res 

  expect(target).to.be.a('object').and.that.have.a.property('comment').and.that.is.a('array')

  target.comment.forEach(item => {

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

    let imageId
    let userId
    let movieId
    let commentId
    let result
    let updatedAt

    before(function(done) {

      const { model:image } = mockCreateImage({
        src: COMMON_API
      })

      image.save()
      .then(data => {
        imageId = data._id
        const { model: user } = mockCreateUser({
          username: COMMON_API,
          avatar: imageId
        })

        return user.save()
      })
      .then(user => {
        userId = user._id
        const { model } = mockCreateMovie({
          name: COMMON_API,
          author: userId
        })

        return model.save()
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

        return model.save()
      })
      .then(data => {
        result = data
        commentId = data._id
        return MovieModel.updateOne({
          name: COMMON_API
        }, {
          $push: { 
            comment: commentId, 
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
        ImageModel.deleteOne({
          src: COMMON_API
        }),
        MovieModel.deleteOne({
          name: COMMON_API
        }),
        UserModel.deleteOne({
          username: COMMON_API
        }),
        CommentModel.deleteOne({
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

      before(async function() {
        updatedAt = await MovieModel.findOne({
          name: COMMON_API
        })
        .select({
          _id: 0,
          updatedAt: 1
        })
        .exec()
        .then(data => {
          return data._doc.updatedAt
        })
        .catch(err => {
          console.log('oops: ', err)
        })

        return !!updatedAt ? Promise.resolve() : Promise.reject(COMMON_API)

      })

      it(`get the comment list in movie page success`, function(done) {

        Request
        .get(COMMON_API)
        .query({
          _id: movieId.toString()
        })
        .set({
          Accept: 'Application/json',
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

      it(`get the comment list in movie page success and return the status of 304`, function(done) {

        const query = {
          _id: movieId.toString()
        }

        Request
        .get(COMMON_API)
        .query(query)
        .set({
          Accept: 'Application/json',
          'If-Modified-Since': updatedAt,
          'If-None-Match': createEtag(query)
        })
        .expect(304)
        .expect('Last-Modified', updatedAt.toString())
        .expect('ETag', createEtag(query))
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

      it(`get the comment list in movie page success and hope return the status of 304 but the content has edited`, function(done) {

        const query = {
          _id: movieId.toString()
        }

        Request
        .get(COMMON_API)
        .query(query)
        .set({
          Accept: 'Application/json',
          'If-Modified-Since': new Date(Day(updatedAt).valueOf - 10000000),
          'If-None-Match': createEtag(query)
        })
        .expect(200)
        .expect('Last-Modified', updatedAt.toString())
        .expect('ETag', createEtag(query))
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

      it(`get the comment list in movie page success and hope return the status of 304 but the params of query is change`, function(done) {

        const query = {
          offset: 0,
          _id: movieId.toString()
        }

        Request
        .get(COMMON_API)
        .query({
          _id: movieId.toString()
        })
        .set({
          Accept: 'Application/json',
          'If-Modified-Since': new Date(Day(updatedAt).valueOf - 10000000),
          'If-None-Match': createEtag(query)
        })
        .expect(200)
        .expect('Last-Modified', updatedAt.toString())
        .expect('ETag', createEtag({
          _id: movieId.toString()
        }))
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

    })

    describe(`get the comment list in movie page fail test -> ${COMMON_API}`, function() {
      
      it(`get the comment list in movie page fail because the movie id is not found`, function(done) {

        const _id = movieId.toString()

        Request
        .get(COMMON_API)
        .query({
          _id: `${(parseInt(_id.slice(0, 1)) + 5) % 10}${_id.slice(1)}`
        })
        .set({
          Accept: 'Application/json'
        })
        .expect(404)
        .expect('Content-Type', /json/)
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

      it(`get the comment list in movie page fail because the movie id is not verify`, function(done) {

        Request
        .get(COMMON_API)
        .query({
          _id: movieId.toString().slice(1)
        })
        .set({
          Accept: 'Application/json'
        })
        .expect(400)
        .expect('Content-Type', /json/)
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
        .expect('Content-Type', /json/)
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

    })

  })

})