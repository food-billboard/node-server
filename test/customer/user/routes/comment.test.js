require('module-alias/register')
const { expect } = require('chai')
const { mockCreateUser, Request, createEtag, commonValidate } = require('@test/utils')
const { UserModel, CommentModel } = require('@src/utils')

const COMMON_API = '/api/customer/user/comment'

function responseExpect(res, validate=[]) {

  const { res: { data: target } } = res

  //data
  expect(target).is.a('array')
  target.forEach((item) => {
    expect(item).is.a('object').that.includes.all.keys('content', 'createdAt', 'updatedAt', 'source', 'source_type', 'total_like', '_id', 'like')
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
    //soruce_type
    commonValidate.string(item.source_type, (target) => {
      return !!~['movie', 'user'].indexOf(target.toLowerCase())
    })
    //source
    expect(item).have.a.property('source').that.is.a('object').and.includes.all.keys('type', 'comment', 'content')
    commonValidate.objectId(item.source.comment)
    commonValidate.string(item.source.type, (target) => {
      return !!~['movie', 'user'].indexOf(target.toLowerCase())
    })
    expect(item.source).have.a.property('content').satisfies(function(target) {
      return item.source.type.toLowerCase() == 'movie' ? target == null : typeof target === 'string'
    })
    //total_like
    commonValidate.number(item.total_like)
    //_id
    commonValidate.objectId(item._id)
    //like
    expect(item.like).to.be.a('boolean')
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

  describe(`get the user comment list and not self and with self info test -> ${COMMON_API}`, function() {

    let selfDatabase
    let userDatabase
    let commentDatabase
    let originCommentDatabase
    let userResult
    let selfToken 

    before(function(done) {
      
      const { model:user } = mockCreateUser({
        username: COMMON_API,
        mobile: 15856998742
      })
      const { model:self, token } = mockCreateUser({
        username: COMMON_API,
        mobile: 15636887459
      })
      selfToken = token
      userDatabase = user
      selfDatabase = self
      
      Promise.all([
        userDatabase.save(),
        selfDatabase.save()
      ])
      .then(function([user, self]) {
        userResult = user

        const { model } = mockCreateComment({
          source: ObjectId('56aa3554e90911b64c36a424'),
          user_info: userResult._id,
          total_like: 1,
          like_person: [ self._id ]
        })
        const { model: origin } = mockCreateComment({
          source: ObjectId('56aa3554e90911b64c36a424'),
          user_info: userResult._id,
          content: {
            text: COMMON_API
          }
        })
        commentDatabase = model
        originCommentDatabase = origin
        return Promise.all([
          commentDatabase.save(),
          originCommentDatabase.save()
        ])
      })
      .then(([comment, origin]) => {
        return Promise.all([
          userDatabase.updateOne({
            mobile: 15856998742
          }, {
            $push: { comment: comment._id }
          }),
          commentDatabase.updateOne({
            user_info: userResult._id,
          }, {
            source: origin._id
          })
        ])
      })
      .then(function(_) {
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
          user_info: userResult._id,
        })
      ])
      .then(function() {
        done()
      })
      .catch(err => {
        console.log('oops: ', err)
      })
    })

    describe(`get the user comment list and not self and with self info success test -> ${COMMON_API}`, function() {

      it(`get the user comment list and not self and with self info success`, function() {

        Request
        .get(COMMON_API)
        .query({
          _id: userResult._id.toString(),
          Authorization: `Basic ${selfToken}`
        })
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

      it(`get the user comment list and not self and with self info success and return the status of 304`, function(done) {

        const query = {
          _id: userResult._id.toString()
        }

        Request
        .get(COMMON_API)
        .query(query)
        .set({
          Accept: 'Application/json',
          'If-Modified-Since': userResult.updatedAt,
          'If-None-Match': createEtag(query),
          Authorization: `Basic ${selfToken}`
        })
        .expect(304)
        .expect({
          'Content-Type': /json/,
          'Last-Modified': userResult.updatedAt,
          'ETag': createEtag(query)
        })
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

      it(`get the user comment list and not self and with self info success and hope return the status of 304 but the content has edited`, function(done) {

        const query = {
          _id: userResult._id.toString()
        }

        Request
        .get(COMMON_API)
        .query(query)
        .set({
          Accept: 'Application/json',
          'If-Modified-Since': new Date(Day(userResult.updatedAt).valueOf - 10000000),
          'If-None-Match': createEtag(query),
          Authorization: `Basic ${selfToken}`
        })
        .expect(200)
        .expect({
          'Content-Type': /json/,
          'Last-Modified': userResult.updatedAt,
          'ETag': createEtag(query)
        })
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

      it(`get the user comment list and not self and with self info success and hope return the status of 304 but the params of query is change`, function(done) {

        const query = {
          _id: userResult._id.toString()
        }

        Request
        .get(COMMON_API)
        .query(query)
        .set({
          Accept: 'Application/json',
          'If-Modified-Since': new Date(Day(userResult.updatedAt).valueOf - 10000000),
          'If-None-Match': createEtag({
            ...query,
            pageSize:9
          }),
          Authorization: `Basic ${selfToken}`
        })
        .expect(200)
        .expect({
          'Content-Type': /json/,
          'Last-Modified': userResult.updatedAt,
          'ETag': createEtag({
            ...query,
            pageSize: 9
          })
        })
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

    })

    describe(`get the user comment list and not self and with self info fail test -> ${COMMON_API}`, function() {

      it(`get the user comment list and not self and with self info fail because the user id is not found`, function(done) {

        const { _id } = userResult

        Request
        .get(COMMON_API)
        .query('_id', `${parseInt(_id.slice(0, 1) + 5) % 10}${_id.slice(1)}`)
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(404)
        .expect('Content-Type', /json/)
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

      it(`get the user comment list and not self and with self info fail because the user id is not verify`, function(done) {
        
        Request
        .get(COMMON_API)
        .query('_id', userResult._id.slice(1))
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
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
