require('module-alias/register')
const { UserModel, MovieModel, MOVIE_STATUS } = require('@src/utils')
const { expect } = require('chai')
const { Request, mockCreateUser, mockCreateMovie } = require('@test/utils')

const COMMON_API = '/api/manage/movie/detail/valid'

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
      MovieModel.deleteMany({
        name: COMMON_API
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

    describe(`put the movie status success -> ${COMMON_API}`, function() {

      after(function(done) {

        MovieModel.findOne({
          _id: movieId,
          status: MOVIE_STATUS.COMPLETE
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

      it(`put the movie status success`, function(done) {

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

    describe(`forbidden movie success -> ${COMMON_API}`, function() {

      let movieIdA 
      let movieIdB
      before(function(done) {
        const { model: movieA } = mockCreateMovie({
          name: COMMON_API + '1'
        })
        const { model: movieB } = mockCreateMovie({
          name: COMMON_API + '2'
        })

        Promise.all([
          movieA.save(),
          movieB.save(),
        ])
        .then(([movieA, movieB]) => {
          movieIdA = movieA._id 
          movieIdB = movieB._id 
          done()
        })
        .catch(err => {
          done(err)
          console.log('oops: ', err)
        })
      })

      after(function(done) {

        MovieModel.find({
          _id: { $in: [movieIdA, movieIdB] },
          status: MOVIE_STATUS.NOT_VERIFY
        })
        .select({
          _id: 1
        })
        .exec()
        .then(data => !!data)
        .then(data => {
          expect(data.length).to.be.equal(2)
        })
        .then(_ => {
          return MovieModel.deleteMany({
            _id: { $in: [movieIdA, movieIdB] }
          }) 
        })
        .then(_ => {
          done()
        })
        .catch(err => {
          done(err)
          console.log('oops: ', err)
        })

      })

      it(`forbidden the movie success`, function(done) {

        Request
        .delete(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .query({
          _id: `${movieIdA.toString()},${movieIdB.toString()}`,
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

      MovieModel.updateOne({
        _id: movieId,
      }, {
        $set: { status: MOVIE_STATUS.VERIFY }
      })
      .then(_ => {
        done()
      })
      .catch(err => {
        done(err)
        console.log('oops: ', err)
      })

    })

    it(`put the movie status fail because lack of the id`, function(done) {

      Request
      .put(COMMON_API)
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

    it(`put the movie status fail because the id not found`, function(done) {

      Request
      .put(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        _id: "571094e2976aeb1df982ad5e",
      })
      // .expect(400)
      .expect('Content-Type', /json/)
      .end(function(err) {
        if(err) return done(err)
        done()
      })

    })

    it(`put the movie status fail because the id not valid`, function(done) {

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

    it(`forbidden the movie fail because lack of the id`, function(done) {

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

    it(`forbidden the movie fail because the id not found`, function(done) {

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

    it(`forbidden the movie fail because the id not valid`, function(done) {

      Request
      .delete(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
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