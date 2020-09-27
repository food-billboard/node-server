require('module-alias/register')
const { expect } = require('chai')
const { 
  mockCreateActor, 
  mockCreateMovie,
  mockCreateDirector,
  mockCreateLanguage,
  mockCreateDistrict,
  mockCreateClassify,
  Request, 
  commonValidate, 
} = require('@test/utils')
const { ActorModel, MovieModel, DirectorModel, LanguageModel, DistrictModel, ClassifyModel } = require('@src/utils')
const mongoose = require('mongoose')
const { Types: { ObjectId } } = mongoose

const COMMON_API = '/api/user/movie/search'

function responseExpect(res, validate=[]) {

  const { res: { data: target } } = res 

  expect(target).to.be.a('array')

  target.forEach(item => {
    expect(item).to.be.a('object').and.that.include.all.keys('description', 'name', 'poster', '_id', 'classify', 'publish_time', 'hot', 'rate', 'store')
    commonValidate.string(item.description)
    commonValidate.string(item.name)
    commonValidate.poster(item.poster)
    commonValidate.objectId(item._id)
    expect(item.classify).to.be.a('array')
    item.classify.forEach(cls => expect(cls).to.be.a('object').have.a.property('name').that.is.a('string').and.lengthOf.above(0))
    commonValidate.date(item.publish_time)
    commonValidate.number(item.hot)
    commonValidate.number(item.rate)
    expect(item.store).to.be.a('boolean')
  })

  if(Array.isArray(validate)) {
    validate.forEach(valid => {
      typeof valid == 'function' && valid(target)
    })
  }else if(typeof validate == 'function') {
    validate(target)
  }

}

describe(`get the search result test -> ${ COMMON_API }`, function() {

  let actorId
  let directorId
  let languageId
  let districtId
  let classifyId
  let date = Date.now()

  before(function(done) {

    const { model: actor } = mockCreateActor({
      name: COMMON_API
    })
    const { model: director } = mockCreateDirector({
      name: COMMON_API
    })
    const { model: language } = mockCreateLanguage({
      name: COMMON_API
    })
    const { model: district } = mockCreateDistrict({
      name: COMMON_API
    })
    const { model: classify } = mockCreateClassify({
      name: COMMON_API
    })

    Promise.all([
      actor.save(),
      director.save(),
      language.save(),
      district.save(),
      classify.save(),
    ])
    .then(([actor, director, language, district, classify]) => {
      actorId = actor._id
      directorId = director._id
      languageId = language._id
      districtId = district._id
      classifyId = classify._id

      const { model } = mockCreateMovie({
        name: COMMON_API,
        info: {
          another_name: [ `${COMMON_API}-alias` ],
          actor: [actorId],
          director: [directorId],
          district: [districtId],
          language: [languageId],
          classify: [classifyId],
          description: `${COMMON_API}-description`,
          screen_time: new Date(date)
        },
        source_type: 'ORIGIN',
        author: ObjectId('53102b43bf1044ed8b0ba36b'),
        author_description: `${COMMON_API}-author_description`
      })

      return model.save()
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
      ActorModel.deleteMany({
        name: COMMON_API
      }),
      MovieModel.deleteMany({
        name: COMMON_API
      }),
      DirectorModel.deleteMany({
        name: COMMON_API
      }),
      LanguageModel.deleteMany({
        name: COMMON_API
      }),
      DistrictModel.deleteMany({
        name: COMMON_API
      }),
      ClassifyModel.deleteMany({
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

  describe(`get the search result success test -> ${COMMON_API}`, function() {

    describe(`get the search result success and request content -> ${COMMON_API}`, function() {

      it(`get the search result success and request content and match the name`, function(done) {

        Request
        .get(COMMON_API)
        .query({
          content: COMMON_API
        })
        .set({
          Accept: 'Application/json'
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
          expect(obj.res.data.length).to.be.above(0)

          done()
        })

      })

      it(`get the search result success and request content and match the description`, function(done) {

        Request
        .get(COMMON_API)
        .query({
          content: `${COMMON_API}-description`
        })
        .set({
          Accept: 'Application/json'
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

          expect(obj.res.data.length).to.be.above(0)

          done()
        })

      })

      it(`get the search result success and request content and match the alias`, function(done) {

        Request
        .get(COMMON_API)
        .query({
          content: `${COMMON_API}-alias`
        })
        .set({
          Accept: 'Application/json'
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

          expect(obj.res.data.length).to.be.above(0)

          done()
        })

      })

      it(`get the search result success and request content and match the author_description`, function(done) {

        Request
        .get(COMMON_API)
        .query({
          content: `${COMMON_API}-author_description`
        })
        .set({
          Accept: 'Application/json'
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

          expect(obj.res.data.length).to.be.above(0)

          done()
        })

      })

    })

    describe(`get the search result success and request district -> ${COMMON_API}`, function() {

      it(`get the search result success and request district`, function(done) {

        Request
        .get(COMMON_API)
        .query({
          area: districtId.toString()
        })
        .set({
          Accept: 'Application/json'
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

          expect(obj.res.data.length).to.be.above(0)

          done()
        })

      })

    })

    describe(`get the search result success and request actor -> ${COMMON_API}`, function() {

      it(`get the search result success and request actor`, function(done) {

        Request
        .get(COMMON_API)
        .query({
          actor: actorId.toString()
        })
        .set({
          Accept: 'Application/json'
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

          expect(obj.res.data.length).to.be.above(0)

          done()
        })

      })

    })

    describe(`get the search result success and request director -> ${COMMON_API}`, function() {

      it(`get the search result success and request director`, function(done) {

        Request
        .get(COMMON_API)
        .query({
          director: directorId.toString()
        })
        .set({
          Accept: 'Application/json'
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

          expect(obj.res.data.length).to.be.above(0)

          done()
        })

      })

    })

    describe(`get the search result success and request language -> ${COMMON_API}`, function() {

      it(`get the search result success and request language`, function(done) {

        Request
        .get(COMMON_API)
        .query({
          lang: languageId.toString()
        })
        .set({
          Accept: 'Application/json'
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

          expect(obj.res.data.length).to.be.above(0)

          done()
        })

      })

    })

    describe(`get the search result success and request sort -> ${COMMON_API}`, function() {

      it(`get the search result success and request sort`, function(done) {

        Request
        .get(COMMON_API)
        .query({
          sort: `author_rate=1,rate=1,hot=1,glance=1`
        })
        .set({
          Accept: 'Application/json'
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

          expect(obj.res.data.length).to.be.above(0)

          done()
        })

      })

    })

    describe(`get the search result success and request screen_time -> ${COMMON_API}`, function() {

      it(`get the search result success and request screen_time`, function(done) {

        Request
        .get(COMMON_API)
        .query({
          time: new Date(date)
        })
        .set({
          Accept: 'Application/json'
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

          expect(obj.res.data.length).to.be.above(0)

          done()
        })

      })

    })

    describe(`get the search result success and request all params`, function() {

      it(`get the search result success and request all params`, function(done) {

        Request
        .get(COMMON_API)
        .query({
          content: COMMON_API,
          area: districtId.toString(),
          director: directorId.toString(),
          actor: actorId.toString(),
          time: new Date(date),
          lang: languageId.toString(),
          sort: `author_rate=1,rate=1,hot=1,glance=1`
        })
        .set({
          Accept: 'Application/json'
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

          expect(obj.res.data.length).to.be.above(0)

          done()
        })

      })

    })

  })

})