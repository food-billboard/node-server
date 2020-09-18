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
    commonValidate.objectId(item)
  })
  expect(target.info).to.be.a('object').and.that.includes.all.keys('actor', 'another_name', 'classify', 'description', 'director', 'district', 'language', 'name', 'screen_time')
  const { another_name, name, screen_time, ...nextInfo } = target.info

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

    let imageDatabase
    let videoDatabase
    let classifyDatabase
    let languageDatabase
    let actorDatabase
    let directorDatabase
    let movieDatabase
    let userDatabase
    let districtDatabase
    let imageId
    let userId
    let selfToken
    let result

    before(async function() {

      const { model:image } = mockCreateImage({
        src: COMMON_API
      })
      imageDatabase = image

      await imageDatabase.save()
      .then(data => {
        imageId = data._id
        const { model: video } = mockCreateVideo({
          src: COMMON_API,
          poster: imageId
        })
        const { model: director } = mockCreateDirector({
          name: COMMON_API
        })
        const { model: classify } = mockCreateClassify({
          name: COMMON_API
        })
        const { model: district } = mockCreateDistrict({
          name: COMMON_API
        })
        const { model: actor } = mockCreateActor({
          name: COMMON_API,
          other: {
            avatar: imageId
          }
        })
        const { model: language } = mockCreateLanguage({
          name: COMMON_API
        })
        const { model: user, token } = mockCreateUser({
          username: COMMON_API
        })
        videoDatabase = video
        directorDatabase = director
        classifyDatabase = classify
        districtDatabase = district
        actorDatabase = actor
        languageDatabase = language
        userDatabase = user
        selfToken = token
        return Promise.all([
          videoDatabase.save(),
          directorDatabase.save(),
          classifyDatabase.save(),
          districtDatabase.save(),
          actorDatabase.save(),
          languageDatabase.save(),
          userDatabase.save()
        ])
      })
      .then(([video, director, classify, district, actor, language, user]) => {
        userId = user._id
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
        movieDatabase = model
        return movieDatabase.save()
      })
      .then(function(data) {
        result = data
      })
      .catch(err => {
        console.log('oops: ', err)
      })

      return Promise.resolve()

    })

    after(async function() {

      Promise.all([
        imageDatabase.deleteOne({
          src: COMMON_API
        }),
        videoDatabase.deleteOne({
          src: COMMON_API
        }),
        classifyDatabase.deleteOne({
          name: COMMON_API
        }),
        languageDatabase.deleteOne({
          name: COMMON_API
        }),
        actorDatabase.deleteOne({
          name: COMMON_API
        }),
        directorDatabase.deleteOne({
          name: COMMON_API
        }),
        movieDatabase.deleteOne({
          name: COMMON_API
        }),
        userDatabase.deleteOne({
          username: COMMON_API
        }),
        districtDatabase.deleteOne({
          name: COMMON_API
        })
      ])
      .catch(err => {
        console.log('oops: ', err)
      })

      return Promise.resolve()

    })

    describe(`get the movie detail width self info success test -> ${COMMON_API}`, function() {

      it(`get the movie dtail success`, function(done) {

        Request
        .get(COMMON_API)
        .query({
          _id: result._id.toString(),
        })
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(200)
        .expect({
          'Content-Type': /json/,
        })
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

        Request
        .get(COMMON_API)
        .query({ _id: result._id.toString() })
        .set({
          Accept: 'Application/json',
          'If-Modified-Since': result.updatedAt,
          'If-None-Match': createEtag({}),
          Authorization: `Basic ${selfToken}`
        })
        .expect(304)
        .expect({
          'Content-Type': /json/,
          'Last-Modified': result.updatedAt,
          'ETag': createEtag({})
        })
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

      it(`get the movie dtail success and hope return the status of 304 but the content has edited`, function(done) {

        const query = {
          _id: result._id.toString()
        }

        Request
        .get(COMMON_API)
        .query(query)
        .set({
          Accept: 'Application/json',
          'If-Modified-Since': new Date(Day(result.updatedAt).valueOf - 10000000),
          'If-None-Match': createEtag(query),
          Authorization: `Basic ${selfToken}`
        })
        .expect(200)
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

      it(`get the movie dtail success and hope return the status of 304 but the params of query is change`, function(done) {

        const query = {
          pageSize: 10,
          _id: result._id.toString()
        }

        Request
        .get(COMMON_API)
        .query(query)
        .set({
          Accept: 'Application/json',
          'If-Modified-Since': new Date(Day(result.updatedAt).valueOf - 10000000),
          'If-None-Match': createEtag({_id: result._id.toString()}),
          Authorization: `Basic ${selfToken}`
        })
        .expect(200)
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

    })

    describe(`get the movie detail width self info fail test -> ${COMMON_API}`, function() {

      describe(`get the movie detail width self info fail because of the params -> ${COMMON_API}`, function() {

        it(`get the movie detail fail because of the movie id is not verify`, function(done) {

          Request
          .get(COMMON_API)
          .query({
            _id: result._id.toString().slice(1),
          })
          .set({
            Accept: 'Application/json',
            Authorization: `Basic ${selfToken}`
          })
          .expect(400)
          .expect({
            'Content-Type': /json/,
          })
          .end(function(err, _) {
            if(err) return done(err)
            done()
          })

        })
  
        it(`get the movie detail fail because of the movie id is not found`, function(done) {

          const id = result._id.toString()
  
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
          .expect({
            'Content-Type': /json/,
          })
          .end(function(err, _) {
            if(err) return done(err)
            done()
          })

        })

      })

      describe(`get the movie detail width self info fail because of the auth -> ${COMMON_API}`, function() {

        before(function(done) {

          userDatabase.updateOne({
            name: COMMON_API
          }, {
            author: ObjectId('53102b43bf1044ed8b0ba36b')
          })
          .then(function() {
            done()
          })
          .catch(err => {
            console.log('oops: ', err)
          })

        })

        it(`get the movie detail fail because the movie is not create by self user`, function(done) {
  
          Request
          .get(COMMON_API)
          .query({
            _id: result._id.toString()
          })
          .set({
            Accept: 'Application/json',
            Authorization: `Basic ${selfToken}`
          })
          .expect(404)
          .expect({
            'Content-Type': /json/,
          })
          .end(function(err, _) {
            if(err) return done(err)
            done()
          })

        })

      })

    })

  })

}) 