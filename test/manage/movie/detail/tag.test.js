require('module-alias/register')
const { UserModel, TagModel } = require('@src/utils')
const { expect } = require('chai')
const { Request, mockCreateUser, mockCreateTag } = require('@test/utils')

const COMMON_API = '/api/manage/movie/detail/tag'

describe(`${COMMON_API} test`, function() {

  let selfToken
  let userInfo
  let tagId

  before(function(done) {

    const { model: user, signToken } = mockCreateUser({
      username: COMMON_API
    })
    const { model: tag } = mockCreateTag({
      text: COMMON_API,
      weight: 1,
      valid: true,
    })

    Promise.all([
      user.save(),
      tag.save()
    ])
    .then(([user, tag]) => {
      userInfo = user
      tagId = tag._id
      selfToken = signToken(userInfo._id)
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
      TagModel.deleteMany({
        text: COMMON_API
      }),
    ])
    .then(function() {
      done()
    })
    .catch(err => {
      console.log('oops: ', err)
    })

  })

  describe(`${COMMON_API} success test`, function() {

    describe(`put the tag status success -> ${COMMON_API}`, function() {

      after(function(done) {

        TagModel.findOne({
          _id: tagId,
          valid: false
        })
        .select({
          _id: 1
        })
        .exec()
        .then(data => !!data)
        .then(data => {
          expect(data).to.be.true
          done()
        })
        .catch(err => {
          done(err)
          console.log('oops: ', err)
        })

      })

      it(`put the tag status success`, function(done) {

        Request
        .put(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .send({
          _id: tagId.toString(),
          valid: false
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err) {
          if(err) return done(err)
          done()
        })
  
      })

    })

    describe(`delete the tag success -> ${COMMON_API}`, function() {

      let tagIdA 
      let tagIdB 
      before(function() {
        const { model: tagA } = mockCreateTag({
          text: COMMON_API + '1',
          weight: 1,
          valid: true,
        })
        const { model: tagB } = mockCreateTag({
          text: COMMON_API + '2',
          weight: 1,
          valid: true,
        })

        Promise.all([
          tagA.save(),
          tagB.save()
        ])
        .then(([tagA, tagB]) => {
          tagIdA = tagA._id 
          tagIdB = tagB._id 
          done()
        })
        .catch(err => {
          done(err)
          console.log('oops: ', err)
        })

      })

      after(function(done) {

        TagModel.find({
          _id: { $in: [tagIdA, tagIdB] },
        })
        .select({
          _id: 1
        })
        .exec()
        .then(data => !!data)
        .then(data => {
          expect(!!data.length).to.be.false
          done()
        })
        .catch(err => {
          done(err)
          console.log('oops: ', err)
        })

      })

      it(`delete the tag success`, function(done) {

        Request
        .delete(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .query({
          _id: `${tagIdA.toString()},${tagIdB.toString()}`,
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err) {
          if(err) return done(err)
          done()
        })
  
      })

    })

  })

  describe(`${COMMON_API} fail test`, function() {

    before(function(done) {

      const { model: tag } = mockCreateTag({
        text: COMMON_API,
        weight: 1,
        valid: true,
      })

      tag.save()
      .then(data => {
        tagId = data._id
        done()
      })
      .catch(err => {
        done(err)
        console.log('oops: ', err)
      })

    })

    it(`put the tag status fail because lack of the id`, function(done) {

      Request
      .put(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        valid: false
      })
      .expect(400)
      .expect('Content-Type', /json/)
      .end(function(err) {
        if(err) return done(err)
        done()
      })

    })

    it(`put the tag status fail because the id not found`, function(done) {

      Request
      .put(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        _id: "571094e2976aeb1df982ad5e",
        valid: false
      })
      // .expect(400)
      .expect('Content-Type', /json/)
      .end(function(err) {
        if(err) return done(err)
        done()
      })

    })

    it(`put the tag status fail because the id not valid`, function(done) {

      Request
      .put(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        _id: tagId.toString().slice(1),
        valid: false
      })
      .expect(400)
      .expect('Content-Type', /json/)
      .end(function(err) {
        if(err) return done(err)
        done()
      })

    })

    it(`put the tag status fail because lack of the valid`, function(done) {

      Request
      .put(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        _id: tagId.toString(),
      })
      .expect(400)
      .expect('Content-Type', /json/)
      .end(function(err) {
        if(err) return done(err)
        done()
      })

    })

    it(`put the tag status fail because the valid not valid`, function(done) {

      Request
      .put(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        _id: tagId.toString(),
        valid: null
      })
      .expect(400)
      .expect('Content-Type', /json/)
      .end(function(err) {
        if(err) return done(err)
        done()
      })

    })

    it(`delete the tag fail because lack of the id`, function(done) {

      Request
      .delete(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .expect(400)
      .expect('Content-Type', /json/)
      .end(function(err) {
        if(err) return done(err)
        done()
      })

    })

    it(`delete the tag fail because the id not found`, function(done) {

      Request
      .delete(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
        _id: "571094e2976aeb1df982ad4e",
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function(err) {
        if(err) return done(err)
        done()
      })

    })

    it(`delete the tag fail because the id not valid`, function(done) {

      Request
      .delete(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
        _id: tagId.toString().slice(1),
      })
      .expect(400)
      .expect('Content-Type', /json/)
      .end(function(err) {
        if(err) return done(err)
        done()
      })

    })

  })

})