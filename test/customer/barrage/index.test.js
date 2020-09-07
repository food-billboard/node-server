require('module-alias/register')
const { expect } = require('chai')
const { 
  Request, 
  mockCreateUser,
  mockCreateBarrage,
  mockCreateMovie,
  commonValidate
} = require('@test/utils')
const {
  BarrageModel
} = require('@src/utils')
const mongoose = require("mongoose")
const { Types: { ObjectId } } = mongoose

const COMMON_API = '/api/customer/barrage'

function responseExpect(res, validate=[]) {
  const { res: { data: target } } = res
         
  expect(target).to.be.a('array')
  target.forEach(item => {
    expect(item).to.be.a('object').and.that.includes.all.keys('hot', 'like', 'time_line', '_id', 'content')
    commonValidate.number(item.hot)
    expect(item.like).to.be.a('boolean')
    commonValidate.number(item.time_line)
    commonValidate.objectId(item._id)
    commonValidate.string(item.content)
  })

  if(Array.isArray(validate)) {
    validate.forEach(valid => {
      typeof valid == 'function' && valid(target)
    })
  }else if(typeof validate === 'function') {
    validate(target)
  }
}

describe(`${COMMON_API} test`, function() {

  let userDatabase
  let barrageDatabase
  let movieDatabase
  let result
  let userId
  let movieId
  let userToken
  const values = {
    origin: new ObjectId('56aa3554e90911b64c36a424'),
    user: new ObjectId('56aa3554e90911b64c36a425')
  }

  before(function(done) {

    const { model, token } = mockCreateUser({
      username: COMMON_API
    })
    const { model: movie } = mockCreateMovie({
      name: COMMON_API
    })
    userDatabase = model
    movieDatabase = movie
    userToken = token
    
    Promise.all([
      userDatabase.save(),
      movieDatabase.save()
    ])
    .then(([user, movie]) => {
      userId = user._id
      movieId = movie._id
      const { model } = mockCreateBarrage({
        ...values,
        like_users: [ userId ],
        content: COMMON_API
      })
      barrageDatabase = model
      return barrageDatabase.save()
    })
    .then(data => {
      result = data
      return movieDatabase.updateOne({
        name: COMMON_API
      }, {
        barrage: [ data._id ]
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
      userDatabase.deleteOne({
        username: COMMON_API
      }),
      BarrageModel.deleteMany({
        origin: movieId
      }),
      movieDatabase.deleteOne({
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

  describe(`pre check token test -> ${COMMON_API}`, function() {

    describe(`success test -> ${COMMON_API}`, function() {

      it(`complete the token verify test`, function(done) {

        Request
        .get(COMMON_API)
        .query({
          _id: movieId.toString()
        })
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${userToken}`
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

    })

    describe(`fail test -> ${COMMON_API}`, function() {

      it(`fail the token verify because of without the token`, function(done) {

        Request
        .get(COMMON_API)
        .query({
          _id: movieId.toString()
        })
        .set({
          Accept: 'Application/json',
        })
        .expect(401)
        .expect('Content-Type', /json/)
        .end(function(err) {
          if(err) return done(err)
          done()
        })

      })

      it(`fail the token verify because of the token the outof date`, function(done) {

        this.timeout(11000)

        Request
        .get(COMMON_API)
        .query({
          _id: movieId.toString()
        })
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${userToken}`
        })
        .expect(401)
        .expect('Content-Type', /json/)
        .end(function(err) {
          if(err) return done(err)
          done()
        })

      })

      it(`fail the token verify because the token is not verify`, function(done) {

        Request
        .get(COMMON_API)
        .query({
          _id: movieId.toString()
        })
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${userToken.slice(1)}`
        })
        .expect(401)
        .expect('Content-Type', /json/)
        .end(function(err) {
          if(err) return done(err)
          done()
        })

      })

    })
    
  })

  describe(`get barrage list test -> ${COMMON_API}`, function() {

    describe(`get the movie barrage list success test`, function() {

      it(`success get test`, function(done) {

        done()

      })

    })

    describe(`get the movie barrage list fail test`, function() {

      it(`get list fail because of not have the movie id param`, function(done) {

        Request
        .get(COMMON_API)
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${userToken.slice(1)}`
        })
        .expect(400)
        .expect('Content-Type', /json/)
        .end(function(err) {
          if(err) return done(err)
          done()
        })

      })

      it(`get list fail because of the database can not find the movie id`, function(done) {

        const id = movieId.toString()

        Request
        .get(COMMON_API)
        .query({
          _id: `${(parseInt(id.slice(0, 1)) + 5) % 10}${id.slice(1)}`
        })
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${userToken.slice(1)}`
        })
        .expect(404)
        .expect('Content-Type', /json/)
        .end(function(err) {
          if(err) return done(err)
          done()
        })

      })

      it(`get list fail because of the movie id is not verify`, function(done) {

        Request
        .get(COMMON_API)
        .query({
          _id: movieId.toString().slice(1)
        })
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${userToken.slice(1)}`
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

  describe(`put barrage test -> ${COMMON_API}`, function() {

    after(function(done) {
      BarrageModel.deleteMany({
        content: COMMON_API
      })
      .then(function() {
        done()
      })
      .catch(err => {
        console.log('oops: ', err)
      })
    })
    
    describe(`put barrage success`, function() {

      it(`put the movie barrage success`, function(done) {

        Request
        .put(COMMON_API)
        .send({
          time: 1000,
          content: COMMON_API,
          _id: movieId.toString()
        })
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${userToken.slice(1)}`
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err) {
          if(err) return done(err)
          done()
        })

      })

    })

    describe(`put barrage fail`, function() {

      it(`put the barrage fail because of without barrage id`, function(done) {

        Request
        .put(COMMON_API)
        .send({
          time: 1000,
          content: COMMON_API,
        })
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${userToken.slice(1)}`
        })
        .expect(400)
        .expect('Content-Type', /json/)
        .end(function(err) {
          if(err) return done(err)
          done()
        })

      })

      it(`put the barrage fail because of unverify barrage id`, function(done) {

        Request
        .put(COMMON_API)
        .send({
          time: 1000,
          content: COMMON_API,
          _id: movieId.toString().slice(1)
        })
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${userToken.slice(1)}`
        })
        .expect(400)
        .expect('Content-Type', /json/)
        .end(function(err) {
          if(err) return done(err)
          done()
        })

      })

      it(`put the barrage fail because of lack of the params of content`, function(done) {

        Request
        .put(COMMON_API)
        .send({
          time: 1000,
          _id: movieId.toString()
        })
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${userToken.slice(1)}`
        })
        .expect(400)
        .expect('Content-Type', /json/)
        .end(function(err) {
          if(err) return done(err)
          done()
        })

      })

      it(`put the barrage fail because the params of content's length is 0`, function(done) {

        Request
        .put(COMMON_API)
        .send({
          time: 1000,
          content: '',
          _id: movieId.toString()
        })
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${userToken.slice(1)}`
        })
        .expect(400)
        .expect('Content-Type', /json/)
        .end(function(err) {
          if(err) return done(err)
          done()
        })

      })

      it(`put the barrage fail because of lack of the params of time`, function(done) {

        Request
        .put(COMMON_API)
        .send({
          content: COMMON_API,
          _id: movieId.toString()
        })
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${userToken.slice(1)}`
        })
        .expect(400)
        .expect('Content-Type', /json/)
        .end(function(err) {
          if(err) return done(err)
          done()
        })

      })

      it(`put the barrage fail because of lack of the params of time is not number`, function(done) {

        Request
        .put(COMMON_API)
        .send({
          time: '400',
          content: COMMON_API,
          _id: movieId.toString()
        })
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${userToken.slice(1)}`
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

  describe(`post like the barrage test -> ${COMMON_API}`, function() {

    describe(`post like the barrage success test -> ${COMMON_API}`, function() {

      before(function(done) {

        barrageDatabase.updateOne({
          origin: movieId
        }, {
          like_users: []
        })
        .then(function() {
          done()
        })
        .catch(err => {
          console.log('oops: ', err)
        })

      })

      it(`like the barrage fail because of the the params have not the movie id`, function(done) {
  
        Request
        .post(COMMON_API)
        .send({
          _id: result._id.toString()
        })
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${userToken.slice(1)}`
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err) {
          if(err) return done(err)
          done()
        })

      })

    })

    describe(`post like the barrage fail test -> ${COMMON_API}`, function() {
      
      it(`like the barrage fail because of the movie id is not fuound`, function(done) {

        const id = movieId.toString()

        Request
        .post(COMMON_API)
        .send({
          _id: `${(parseInt(id.slice(0, 1)) + 5) % 10}${id.slice(1)}`
        })
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${userToken.slice(1)}`
        })
        .expect(400)
        .expect('Content-Type', /json/)
        .end(function(err) {
          if(err) return done(err)
          done()
        })
  
      })
  
      it(`like the barrage fail because of the the params of movie id is not verify`, function(done) {
  
        Request
        .post(COMMON_API)
        .send({
          _id: movieId.toString().slice(1)
        })
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${userToken.slice(1)}`
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

  describe(`cancel like the barrage test -> ${COMMON_API}`, function() {

    describe(`cancel like the barrage success test -> ${COMMON_API}`, function() {

      before(function(done) {

        barrageDatabase.updateOne({
          origin: movieId
        }, {
          like_users: [ userId ]
        })
        .then(function() {
          done()
        })
        .catch(err => {
          console.log('oops: ', err)
        })

      })

      it(`cancel like the barrage success`, function(done) {

        Request
        .delete(COMMON_API)
        .send({
          _id: result._id.toString()
        })
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${userToken.slice(1)}`
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err) {
          if(err) return done(err)
          done()
        })

      })

    })

    describe(`cancel like the barrage fail test -> ${COMMON_API}`, function() {

      it(`cancel like the barrage fail because of the movie id is not fuound`, function(done) {

        const id = result._id.toString()

        Request
        .delete(COMMON_API)
        .send({
          _id: `${(parseInt(id.slice(0, 1)) + 5) % 10}${id.slice(1)}`
        })
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${userToken.slice(1)}`
        })
        .expect(400)
        .expect('Content-Type', /json/)
        .end(function(err) {
          if(err) return done(err)
          done()
        })

      })
  
      it(`cancel like the barrage fail because of the the params have not the movie id`, function(done) {
        
        Request
        .delete(COMMON_API)
        .send({
          _id: result._id.toString().slice(1)
        })
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${userToken.slice(1)}`
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