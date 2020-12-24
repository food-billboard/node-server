require('module-alias/register')
const { expect } = require('chai')
const { 
  mockCreateUser, 
  mockCreateMovie, 
  Request,
} = require('@test/utils')
const { MovieModel, UserModel } = require('@src/utils')

const COMMON_API = '/api/customer/movie/detail/rate'

describe(`${COMMON_API} test`, function() {

  let userId
  let movieId
  let selfToken

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
      userId = user._id
      movieId = movie._id
      selfToken = signToken(userId)
      done()

    })
    .catch(err => {
      console.log('oops: ', err)
    })

  })

  after(function(done) {

    Promise.all([
      UserModel.deleteOne({
        username: COMMON_API,
      }),
      MovieModel.deleteOne({
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

  describe(`put rate for the movie test -> ${COMMON_API}`, function() {

    describe(`put rate for the movie add success test -> ${COMMON_API}`, function() {

      before(function(done) {

        Promise.all([
          MovieModel.updateOne({
            name: COMMON_API
          }, {
            total_rate: 0,
            rate_person: 0
          }),
          UserModel.updateOne({
            username: COMMON_API
          }, {
            rate: []
          })
        ])
        .then(function() {
          done()
        })
        .catch(err => {
          console.log('oops: ', err)
        })

      })

      after(async function() {

        const res = await Promise.all([
          MovieModel.findOne({
            name: COMMON_API
          })
          .select({
            total_rate: 1,
            rate_person: 1,
            _id: 0
          })
          .exec()
          .then(data => !!data && data._doc)
          .then(data => {
            if(typeof data == 'boolean') return false
            const { total_rate, rate_person } = data
            return total_rate == 10 && rate_person == 1
          }),
          UserModel.findOne({
            username: COMMON_API
          })
          .select({
            rate: 1,
            _id: 0
          })
          .exec()
          .then(data => !!data && data._doc)
          .then(data => {
            if(typeof data == 'boolean') return false
            const { rate } = data
            return rate.some(item => item._id.toString() == movieId.toString() && item.rate == 10)
          })
        ])
        .then(data => {
          expect(data).to.be.a('array')
          data.forEach(item => expect(item).to.be.true)
          return true
        })
        .catch(err => {
          console.log('oops: ', err)
          return false
        })

        return res ? Promise.resolve() : Promise.reject('err')

      })

      it(`put rate success and it is a add operation`, function(done) {

        Request
        .put(COMMON_API)
        .send({
          _id: movieId.toString(),
          value: 10
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

    describe(`put rate for the movie update success test -> ${COMMON_API}`, function() {

      before(function(done) {

        Promise.all([
          MovieModel.updateOne({
            name: COMMON_API
          }, {
            total_rate: 10,
            rate_person: 1
          }),
          UserModel.updateOne({
            username: COMMON_API
          }, {
            rate: [
              {
                _id: movieId,
                rate: 10
              }
            ]
          })
        ])
        .then(function() {
          done()
        })
        .catch(err => {
          console.log('oops: ', err)
        })

      })

      after(async function() {

        const res = await Promise.all([
          MovieModel.findOne({
            name: COMMON_API
          })
          .select({
            total_rate: 1,
            rate_person: 1,
            _id: 0
          })
          .exec()
          .then(data => !!data && data._doc)
          .then(data => {
            if(typeof data == 'boolean') return false
            const { total_rate, rate_person } = data
            return total_rate == 4 && rate_person == 1
          }),
          UserModel.findOne({
            username: COMMON_API
          })
          .select({
            rate: 1,
            _id: 0
          })
          .exec()
          .then(data => !!data && data._doc)
          .then(data => {
            if(typeof data == 'boolean') return false
            const { rate } = data
            return rate.some(item => item._id.toString() == movieId.toString() && item.rate == 4)
          })
        ])
        .then(data => {
          expect(data).to.be.a('array')
          data.forEach(item => expect(item).to.be.true)
          return true
        })
        .catch(err => {
          console.log('oops: ', err)
          return false
        })

        return res ? Promise.resolve() : Promise.reject('err')

      })

      it(`put rate success and it is a update operation`, function(done) {

        Request
        .put(COMMON_API)
        .send({
          _id: movieId.toString(),
          value: 4
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

    describe(`put rate for the movie fail test -> ${COMMON_API}`, function() {

      it(`put rate fail because the movie id is not verify`, function(done) {

        Request
        .put(COMMON_API)
        .send({
          _id: movieId.toString().slice(1),
          value: 10
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

      it(`put rate fail because the movie id is not found`, function(done) {

        const id = movieId.toString()

        Request
        .put(COMMON_API)
        .send({
          _id: `${(parseInt(id.slice(0, 1)) + 5) % 10}${id.slice(1)}`,
          value: 10
        })
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(404)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if(err) return done(err)
          done()
        })

      })

      it(`put rate fail because the params of rate is not verify`, function(done) {
        
        Request
        .put(COMMON_API)
        .send({
          _id: movieId.toString(),
          value: null
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

      it(`put rate fail because lack of the params of rate`, function(done) {
        
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

      it(`put rate fail because lack of the params of movie id`, function(done) {
        
        Request
        .put(COMMON_API)
        .send({
          value: 10
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

    })

  })

})