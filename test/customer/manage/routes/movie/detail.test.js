require('module-alias/register')
const { expect } = require('chai')
const { 
  mockCreateUser, 
  Request, 
  createEtag, 
  commonValidate, 
  mockCreateClassify, 
  mockCreateMovie, 
  mockCreateImage,
  mockCreateVideo,
  mockCreateDirector,
  mockCreateDistrict,
  mockCreateActor,
  mockCreateLanguage,
} = require('@test/utils')
const {
  UserModel,
  ClassifyModel,
  MovieModel,
  ImageModel,
  VideoModel,
  DirectorModel,
  DistrictModel,
  ActorModel,
  LanguageModel
} = require('@src/utils')
const Day = require('dayjs')
const { Types: { ObjectId } } = require('mongoose')

const COMMON_API = '/api/customer/manage/movie/detail'

function responseExpect(res, validate=[]) {

  const { res: { data: target } } = res

  expect(target).to.be.a('object').and.that.includes.all.keys(
    'author_description', 'author_rate', 'images', 'info',
    'name', 'video', 'poster', '_id'
  )

  commonValidate.string(target.author_description, function(target) { return true })
  commonValidate.number(target.author_rate)
  expect(target.images).to.be.a('array')
  target.images.forEach(item => {
    commonValidate.poster(item)
  })
  expect(target.info).to.be.a('object').and.that.includes.all.keys('actor', 'another_name', 'classify', 'description', 'director', 'district', 'language', 'name', 'screen_time')
  const { another_name, name, screen_time, description, ...nextInfo } = target.info
  commonValidate.string(description)
  Object.values(nextInfo).forEach(value => {
    expect(value).to.be.a('array')
    value.forEach(v => commonValidate.objectId(v))
  })
  expect(another_name).to.be.a('array')
  another_name.forEach(item => {
    commonValidate.string(item)
  })
  commonValidate.string(name)
  commonValidate.time(screen_time)
  commonValidate.string(target.name)
  commonValidate.poster(target.video)
  commonValidate.poster(target.poster)
  commonValidate.objectId(target._id)

  if(Array.isArray(validate)) {
    validate.forEach(valid => {
      typeof valid == 'function' && valid(target)
    })
  }else if(typeof validate == 'function') {
    validate(target)
  }
}

describe(`${COMMON_API} test`, function() {

  describe(`get the movie detail with self info test -> ${COMMON_API}`, function() {

    let updatedAt
    let imageId
    let movieId
    let userId
    let selfToken
    let result
    let getToken

    before(async function() {

      const { model:image } = mockCreateImage({
        src: COMMON_API
      })

      await image.save()
      .then(data => {
        imageId = data._id
        const { model: video } = mockCreateVideo({
          src: COMMON_API,
          poster: imageId
        })
        const { model: classify } = mockCreateClassify({
          name: COMMON_API
        })
        const { model: district } = mockCreateDistrict({
          name: COMMON_API
        })
        const { model: language } = mockCreateLanguage({
          name: COMMON_API
        })
        const { model: user, signToken } = mockCreateUser({
          username: COMMON_API
        })

        getToken = signToken

        return Promise.all([
          video.save(),
          classify.save(),
          district.save(),
          language.save(),
          user.save()
        ])
      })
      .then(data => {

        const [ ,,district ] = data

        const { model: actor } = mockCreateActor({
          name: COMMON_API,
          other: {
            avatar: imageId
          },
          country: district._id
        })
        const { model: director } = mockCreateDirector({
          name: COMMON_API,
          country: district._id
        })

        return Promise.all([
          actor.save(),
          director.save(),
          ...data
        ])
      })
      .then(([actor, director, video, classify, district, language, user]) => {
        userId = user._id
        selfToken = getToken(userId)
        const { model } = mockCreateMovie({
          video: video._id,
          info: {
            name: COMMON_API,
            director: [ director._id ],
            classify: [ classify._id ],
            district: [ district._id ],
            actor: [ actor._id ],
            language: [ language._id ]
          },
          name: COMMON_API,
          images: [ imageId ],
          poster: imageId,
          author: userId,
          source_type: 'USER'
        })

        return model.save()
      })
      .then(function(data) {
        result = data
        movieId = result._id
        return UserModel.updateOne({
          username: COMMON_API
        }, {
          $set: {
            issue: [ { _id: movieId } ]
          }
        })
      })
      .catch(err => {
        console.log('oops: ', err)
      })

      return Promise.resolve()

    })

    after(async function() {

      Promise.all([
        ImageModel.deleteOne({
          src: COMMON_API
        }),
        VideoModel.deleteOne({
          src: COMMON_API
        }),
        ClassifyModel.deleteOne({
          name: COMMON_API
        }),
        LanguageModel.deleteOne({
          name: COMMON_API
        }),
        ActorModel.deleteOne({
          name: COMMON_API
        }),
        DirectorModel.deleteOne({
          name: COMMON_API
        }),
        MovieModel.deleteOne({
          name: COMMON_API
        }),
        UserModel.deleteOne({
          username: COMMON_API
        }),
        DistrictModel.deleteOne({
          name: COMMON_API
        })
      ])
      .catch(err => {
        console.log('oops: ', err)
      })

      return Promise.resolve()

    })

    describe(`get the movie detail width self info success test -> ${COMMON_API}`, function() {

      beforeEach(async function() {

        updatedAt = await MovieModel.findOne({
          _id: movieId,   
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
          return false
        })

        return !!updatedAt ? Promise.resolve() : Promise.reject(COMMON_API)

      })

      it(`get the movie dtail success`, function(done) {

        Request
        .get(COMMON_API)
        .query({
          _id: movieId.toString(),
        })
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
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

      it(`get the movie dtail success and return the status of 304`, function(done) {

        const query = {
          _id: movieId.toString()
        }

        Request
        .get(COMMON_API)
        .query(query)
        .set({
          Accept: 'Application/json',
          'If-Modified-Since': updatedAt,
          'If-None-Match': createEtag(query),
          Authorization: `Basic ${selfToken}`
        })
        .expect(304)
        .expect('Last-Modified', updatedAt.toString())
        .expect('ETag', createEtag(query))
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

      it(`get the movie dtail success and hope return the status of 304 but the content has edited`, function(done) {

        const query = {
          _id: movieId.toString()
        }

        Request
        .get(COMMON_API)
        .query(query)
        .set({
          Accept: 'Application/json',
          'If-Modified-Since': new Date(Day(updatedAt).valueOf - 10000000),
          'If-None-Match': createEtag(query),
          Authorization: `Basic ${selfToken}`
        })
        .expect(200)
        .expect('Last-Modified', updatedAt.toString())
        .expect('ETag', createEtag(query))
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

      it(`get the movie dtail success and hope return the status of 304 but the params of query is change`, function(done) {

        const query = {
          pageSize: 10,
          _id: movieId.toString()
        }

        Request
        .get(COMMON_API)
        .query(query)
        .set({
          Accept: 'Application/json',
          'If-Modified-Since': new Date(Day(updatedAt).valueOf - 10000000),
          'If-None-Match': createEtag({_id: result._id.toString()}),
          Authorization: `Basic ${selfToken}`
        })
        .expect(200)
        .expect('Last-Modified', updatedAt.toString())
        .expect('ETag', createEtag(query))
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

    })

    describe(`get the movie detail width self info fail test -> ${COMMON_API}`, function() {

      describe(`get the movie detail width self info fail because of the params -> ${COMMON_API}`, function() {

        it(`get the movie detail fail because of the movie id is not verify`, function(done) {

          Request
          .get(COMMON_API)
          .query({
            _id: movieId.toString().slice(1),
          })
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
  
        it(`get the movie detail fail because of the movie id is not found`, function(done) {

          const id = movieId.toString()
  
          Request
          .get(COMMON_API)
          .query({
            _id: `${(parseInt(id.slice(0, 1)) + 5) % 10}${id.slice(1)}`
          })
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

      })

      describe(`get the movie detail width self info fail because of the auth -> ${COMMON_API}`, function() {

        before(async function() {

          const res = await Promise.all([
            MovieModel.updateOne({
              name: COMMON_API
            }, {
              $set: {
                author: ObjectId('53102b43bf1044ed8b0ba36b')
              }
            }),
            UserModel.updateOne({
              username: COMMON_API
            }, {
              $set: {
                issue: []
              }
            })
          ])
          .then(_ => {
            return true
          })
          .catch(err => {
            console.log('oops: ', err)
            return false
          })

          return res ? Promise.resolve() : Promise.reject(COMMON_API)

        })

        it(`get the movie detail fail because the movie is not create by self user`, function(done) {
  
          Request
          .get(COMMON_API)
          .query({
            _id: movieId.toString()
          })
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

      })

    })

  })

}) 