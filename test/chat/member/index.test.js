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

const COMMON_API = '/api/chat/member'

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
        $set: {
          barrage: [ data._id ]
        }
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

  describe(`get member list test -> ${COMMON_API}`, function() {

    describe(`get the member list success test`, function() {

      it(`get the member list success`, function(done) {

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

      it(`get the member list success and not login`, function(done) {

      })

    })

    describe(`get the member list fail test`, function() {

      it(`get member list fail because of not have the room id param`, function(done) {

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

      it(`get member list fail because of the database can not find the room id`, function(done) {

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

      it(`get member list fail because of the room id is not verify`, function(done) {

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

})