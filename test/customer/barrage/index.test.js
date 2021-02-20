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
  BarrageModel,
  MovieModel, 
  UserModel
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

  let result
  let userId
  let movieId
  let userToken
  let getToken
  const values = {
    origin: new ObjectId('56aa3554e90911b64c36a424'),
    user: new ObjectId('56aa3554e90911b64c36a425')
  }

  before(async function() {

    const { model, token, signToken } = mockCreateUser({
      username: COMMON_API
    })
    const { model: movie } = mockCreateMovie({
      name: COMMON_API
    })

    getToken = signToken

    await Promise.all([
      model.save(),
      movie.save()
    ])
    .then(([user, movie]) => {
      userId = user._id
      userToken = getToken(userId)
      movieId = movie._id
      const { model } = mockCreateBarrage({
        ...values,
        origin: movieId,
        like_users: [ userId ],
        content: COMMON_API
      })

      return model.save()
    })
    .then(data => {
      result = data
      return MovieModel.updateOne({
        name: COMMON_API
      }, {
        barrage: [ data._id ]
      })
    })
    .catch(err => {
      console.log('oops: ', err)
    })

    return Promise.resolve()

  })

  after(async function() {
    await Promise.all([
      UserModel.deleteMany({
        username: COMMON_API
      }),
      BarrageModel.deleteMany({
        origin: movieId
      }),
      MovieModel.deleteMany({
        name: COMMON_API
      })
    ])
    .catch(err => {
      console.log('oops: ', err)
    })

    return Promise.resolve()

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
          _id: movieId.toString(),
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

      it(`fail the token verify because of the token the outof date`, async function() {

        await new Promise((resolve) => {
          setTimeout(() => {
            resolve()
          }, 5100)
        })
        .then(_ => {
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
        })

        return Promise.resolve()

      })

      it(`fail the token verify because the token is not verify`, function(done) {

        userToken = getToken(userId)

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

      it(`get the movie barrage list success`, function(done) {

        Request
        .get(COMMON_API)
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${userToken}`
        })
        .query({
          _id: movieId.toString(),
          timeStart: 0,
          process: 20
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
          expect(obj.res.data.length).to.be.eql(0)
          done()
        })

      })

    })

    describe(`get the movie barrage list fail test`, function() {

      it(`get list fail because of not have the movie id param`, function(done) {

        Request
        .get(COMMON_API)
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${userToken}`
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
          const { res: { data } } = obj
          expect(data).to.be.a('array').and.that.lengthOf(0)
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
          Authorization: `Basic ${userToken}`
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
          Authorization: `Basic ${userToken}`
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
          Authorization: `Basic ${userToken}`
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
          Authorization: `Basic ${userToken}`
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
          Authorization: `Basic ${userToken}`
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
          Authorization: `Basic ${userToken}`
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
          Authorization: `Basic ${userToken}`
        })
        .expect(400)
        .expect('Content-Type', /json/)
        .end(function(err) {
          if(err) return done(err)
          done()
        })

      })

      it(`put the barrage fail because of the params of time is not number`, function(done) {

        Request
        .put(COMMON_API)
        .send({
          time: '400a',
          content: COMMON_API,
          _id: movieId.toString()
        })
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${userToken}`
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

        BarrageModel.updateOne({
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

      after(function(done) {

        BarrageModel.findOne({
          origin: movieId
        })
        .select({
          like_users: 1
        })
        .exec()
        .then(data => {
          const { _doc: { like_users } } = data
          expect(like_users.some(user => user.equals(userId)))
          done()
        })
        .catch(err => {
          console.log('oops: ', err)
          done(err)
        })

      })

      it(`post like the barrage success`, function(done) {

        Request
        .post(`${COMMON_API}/like`)
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${userToken}`
        })
        .send({
          _id: result._id.toString()
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

      before(function(done) {

        BarrageModel.updateOne({
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
        .post(`${COMMON_API}/like`)
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${userToken}`
        })
        .expect(400)
        .expect('Content-Type', /json/)
        .end(function(err) {
          if(err) return done(err)
          done()
        })

      })

    })

    describe(`post like the barrage fail test -> ${COMMON_API}`, function() {
      
      it(`like the barrage fail because of the movie id is not fuound`, function(done) {

        const id = result._id.toString()

        Request
        .post(`${COMMON_API}/like`)
        .send({
          _id: `${(parseInt(id.slice(0, 1)) + 5) % 10}${id.slice(1)}`
        })
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${userToken}`
        })
        .expect(404)
        .expect('Content-Type', /json/)
        .end(function(err) {
          if(err) return done(err)
          done()
        })
  
      })
  
      it(`like the barrage fail because of the the params of movie id is not verify`, function(done) {
  
        Request
        .post(`${COMMON_API}/like`)
        .send({
          _id: movieId.toString().slice(1)
        })
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${userToken}`
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

        BarrageModel.updateOne({
          origin: movieId
        }, {
          like_users: [ userId ]
        })
        .then(function(data) {
          console.log(data)
          done()
        })
        .catch(err => {
          console.log('oops: ', err)
        })

      })

      it(`cancel like the barrage success`, function(done) {

        Request
        .delete(`${COMMON_API}/like`)
        .query({
          _id: movieId.toString()
        })
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${userToken}`
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
        .delete(`${COMMON_API}/like`)
        .query({
          _id: `${(parseInt(id.slice(0, 1)) + 5) % 10}${id.slice(1)}`
        })
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${userToken}`
        })
        .expect(404)
        .expect('Content-Type', /json/)
        .end(function(err) {
          if(err) return done(err)
          done()
        })

      })
  
      it(`cancel like the barrage fail because of the the params have not the movie id`, function(done) {
        
        Request
        .delete(`${COMMON_API}/like`)
        .query({
          _id: result._id.toString().slice(1)
        })
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${userToken}`
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