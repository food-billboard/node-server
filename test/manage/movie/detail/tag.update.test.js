require('module-alias/register')
const { UserModel, TagModel, MovieModel } = require('@src/utils')
const { expect } = require('chai')
const { Request, mockCreateUser, mockCreateTag, mockCreateMovie } = require('@test/utils')

const COMMON_API = '/api/manage/movie/detail/tag/update'

function createTag(movieId) {
  const { model: tag } = mockCreateTag({
    text: COMMON_API,
    weight: 1,
    valid: true,
    source: movieId
  })
  return tag.save()
}

describe(`${COMMON_API} test`, function() {

  let selfToken
  let userInfo
  let movieId 

  before(function(done) {

    const { model: user, signToken } = mockCreateUser({
      username: COMMON_API
    })
    const { model: movie } = mockCreateMovie({
      name: COMMON_API
    })

    Promise.all([
      user.save(),
      movie.save()
    ])
    .then(([user, movie]) => {
      userInfo = user
      movieId = movie._id
      selfToken = signToken(userInfo._id)
    })
    .then(_ => {
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
      TagModel.deleteMany({
        text: COMMON_API
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

  describe(`${COMMON_API} success test`, function() {

    describe(`update the movie tag success -> ${COMMON_API}`, function() {

      let tagId 

      before(function() {
        createTag(movieId)
        .then(data => {
          tagId = data._id 
          return MovieModel.updateOne({
            _id: movieId
          }, {
            $set: {
              tag: [tagId]
            }
          })
        })
      })

      after(function(done) {

        TagModel.findOne({
          _id: tagId,
        })
        .select({
          _id: 1
        })
        .exec()
        .then(data => !!data)
        .then(data => {
          expect(data).to.be.false
          done()
        })
        .catch(err => {
          done(err)
          console.log('oops: ', err)
        })

      })

      it(`update the movie tag success`, function(done) {

        Request
        .put(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .send({
          _id: movieId.toString(),
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

    let tagId 

    before(function(done) {

      createTag(movieId)
      .then(data => {
        tagId = data._id
        done()
      })
      .catch(err => {
        done(err)
        console.log('oops: ', err)
      })

    })

    after(function(done) {

      TagModel.findOne({
        _id: tagId,
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

    it(`update the movie tag fail because lack of the id`, function(done) {

      Request
      .put(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({})
      .expect(400)
      .expect('Content-Type', /json/)
      .end(function(err) {
        if(err) return done(err)
        done()
      })

    })

    it(`update the movie tag fail because the id not found`, function(done) {

      Request
      .put(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        _id: "571094e2976aeb1df982ad5e",
      })
      .expect('Content-Type', /json/)
      .end(function(err) {
        if(err) return done(err)
        done()
      })

    })

    it(`update the movie tag fail because the id not valid`, function(done) {

      Request
      .put(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        _id: movieId.toString().slice(1),
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