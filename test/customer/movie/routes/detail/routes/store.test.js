require('module-alias/register')
const { expect } = require('chai')
const { 
  mockCreateUser, 
  mockCreateMovie, 
  Request, 
} = require('@test/utils')

const COMMON_API = '/api/customer/movie/detail/store'

describe(`${COMMON_API} test`, function() {

  let userDatabase
  let movieDatabase
  let userId
  let movieId
  let selfToken

  before(function(done) {

    const { model: user, token } = mockCreateUser({
      username: COMMON_API
    })
    const { model: movie } = mockCreateMovie({
      name: COMMON_API
    })

    userDatabase = user
    movieDatabase = movie
    selfToken = token

    Promise.all([
      userDatabase.save(),
      movieDatabase.save()
    ])
    .then(([user, movie]) => {
      userId = user._id
      movieId = movie._id
      
      done()

    })
    .catch(err => {
      console.log('oops: ', err)
    })

  })

  after(function(done) {

    Promise.all([
      userDatabase.deleteOne({
        username: COMMON_API,
      }),
      movieDatabase.deleteOne({
        name: COMMON_API
      })
    ])
    .then(_ => {
      done()
    })
    .catch(err => {
      console.log('oops: ', err)
    })

  })

  describe(`pre check the params -> ${COMMON_API}`, function() {

    describe(`pre check the params fail test -> ${COMMON_API}`, function() {

      it(`pre check the params fail because the movie id is not verify`, function(done) {

        Request
        .put(COMMON_API)
        .send({
          _id: movieId.toString().slice(1),
        })
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(400)
        .expect('Content-Type', /json/)
        .end(function(err) {
          if(err) return done(err)
          done()
        })

      })

      it(`pre check the params fail because the movie id is not found`, function(done) {

        const id = movieId.toString()

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

      it(`pre check the params fail because lack the params ofmovie id`, function(done) {

        Request
        .put(COMMON_API)
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
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

  describe(`put store the movie test -> ${COMMON_API}`, function() {

    describe(`put store the movie success test -> ${COMMON_API}`, function() {

      before(function(done) {

        Promise.all([
          movieDatabase.updateOne({
            name: COMMON_API
          },{
            hot: 0
          }),
          userDatabase.updateOne({
            username: COMMON_API
          },{
            store: []
          })
        ])
        .then(function() {
          done()
        })
        .catch(err => {
          console.log('oops: ', err)
        })

      })

      after(function(done) {
        
        Promise.all([
          movieDatabase.findOne({
            name: COMMON_API,
          })
          .select({
            _id: 0,
            hot: 1
          })
          .exec()
          .then(data => !!data && data._doc)
          .then(data => {
            expect(data).to.be.not.a('boolean')
            return data.hot == 1
          }),
          userDatabase.findOne({
            username: COMMON_API
          })
          .select({
            store: 1,
            _id: 0
          })
          .exec()
          .then(data => !!data && data._doc)
          .then(data => {
            expect(data).to.be.not.a('boolean')
            return data.store.length == 1
          })
        ])
        .then(function(data) {
          expect(data).to.be.a('array')
          data.forEach(item => expect(item).to.be.true)
          done()
        })
        .catch(err => {
          console.log('oops: ', err)
        })

      })

      it(`put store the movie success`, function(done) {

        Request
        .put(COMMON_API)
        .send({
          _id: movieId.toString()
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

    describe(`put store the movie success test -> ${COMMON_API}`, function() {

      before(function(done) {

        Promise.all([
          movieDatabase.updateOne({
            name: COMMON_API
          },{
            hot: 1
          }),
          userDatabase.updateOne({
            username: COMMON_API
          },{
            store: [ movieId ]
          })
        ])
        .then(function() {
          done()
        })
        .catch(err => {
          console.log('oops: ', err)
        })

      })

      after(function(done) {
        
        Promise.all([
          movieDatabase.findOne({
            name: COMMON_API,
          })
          .select({
            _id: 0,
            hot: 1
          })
          .exec()
          .then(data => !!data && data._doc)
          .then(data => {
            expect(data).to.be.not.a('boolean')
            return data.hot == 1
          }),
          userDatabase.findOne({
            username: COMMON_API
          })
          .select({
            store: 1,
            _id: 0
          })
          .exec()
          .then(data => !!data && data._doc)
          .then(data => {
            expect(data).to.be.not.a('boolean')
            return data.store.length == 1
          })
        ])
        .then(function(data) {
          expect(data).to.be.a('array')
          data.forEach(item => expect(item).to.be.true)
          done()
        })
        .catch(err => {
          console.log('oops: ', err)
        })

      })

      it(`put store the movie fail because the user has stored before`, function(done) {

        Request
        .put(COMMON_API)
        .send({
          _id: movieId.toString()
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

  describe(`cancel store the movie test -> ${COMMON_API}`, function() {

    describe(`cancel store the movie success test -> ${COMMON_API}`, function() {

      before(function(done) {

        Promise.all([
          movieDatabase.updateOne({
            name: COMMON_API
          },{
            hot: 1
          }),
          userDatabase.updateOne({
            username: COMMON_API
          },{
            store: [ movieId ]
          })
        ])
        .then(function() {
          done()
        })
        .catch(err => {
          console.log('oops: ', err)
        })

      })

      after(function(done) {
        
        Promise.all([
          movieDatabase.findOne({
            name: COMMON_API,
          })
          .select({
            _id: 0,
            hot: 1
          })
          .exec()
          .then(data => !!data && data._doc)
          .then(data => {
            expect(data).to.be.not.a('boolean')
            return data.hot == 0
          }),
          userDatabase.findOne({
            username: COMMON_API
          })
          .select({
            store: 1,
            _id: 0
          })
          .exec()
          .then(data => !!data && data._doc)
          .then(data => {
            expect(data).to.be.not.a('boolean')
            return data.store.length == 0
          })
        ])
        .then(function(data) {
          expect(data).to.be.a('array')
          data.forEach(item => expect(item).to.be.true)
          done()
        })
        .catch(err => {
          console.log('oops: ', err)
        })

      })

      it(`cancel store the movie success`, function(done) {
        
        Request
        .delete(COMMON_API)
        .query({
          _id: movieId.toString()
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

    describe(`cancel store the movie fail test -> ${COMMON_API}`, function() {

      before(function(done) {

        Promise.all([
          movieDatabase.updateOne({
            name: COMMON_API
          },{
            hot: 0
          }),
          userDatabase.updateOne({
            username: COMMON_API
          },{
            store: []
          })
        ])
        .then(function() {
          done()
        })
        .catch(err => {
          console.log('oops: ', err)
        })

      })

      after(function(done) {
        
        Promise.all([
          movieDatabase.findOne({
            name: COMMON_API,
          })
          .select({
            _id: 0,
            hot: 1
          })
          .exec()
          .then(data => !!data && data._doc)
          .then(data => {
            expect(data).to.be.not.a('boolean')
            return data.hot == 0
          }),
          userDatabase.findOne({
            username: COMMON_API
          })
          .select({
            store: 1,
            _id: 0
          })
          .exec()
          .then(data => !!data && data._doc)
          .then(data => {
            expect(data).to.be.not.a('boolean')
            return data.store.length == 0
          })
        ])
        .then(function(data) {
          expect(data).to.be.a('array')
          data.forEach(item => expect(item).to.be.true)
          done()
        })
        .catch(err => {
          console.log('oops: ', err)
        })

      })

      it(`cancel store the movie fail because the user not stored before`, function(done) {
        
        Request
        .delete(COMMON_API)
        .query({
          _id: movieId.toString()
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