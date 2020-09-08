require('module-alias/register')
const { expect } = require('chai')
const { 
  mockCreateUser, 
  mockCreateComment, 
  mockCreateClassify, 
  mockCreateMovie, 
  mockCreateTag, 
  mockCreateImage, 
  Request, 
  commonValidate,
  mockCreateVideo,
  mockCreateActor,
  mockCreateDirector,
  mockCreateLanguage,
  mockCreateDistrict
} = require('@test/utils')

const COMMON_API = '/api/user/movie/detail'

function responseExpect(res, validate=[]) {

  const { res: { data: target } } = res 

  expect(target).to.be.a('object').and.that.includes.all.keys(
    'author', 'author_description', 'author_rate', 'comment',
    'createdAt', 'glance', 'hot', 'images', 'info', 'name',
    'poster', 'rate', 'same_film', 'store', 'tag', 'video', '_id'
  )

  expect(target.author).to.be.a('object').and.have.a.property('username').and.is.a('string').and.that.lengthOf.above(0)
  commonValidate.string(target.author_description, function() { return true })
  commonValidate.number(target.author_rate)
  expect(target.comment).to.be.a('array')
  target.comment.forEach(item => {
    expect(item).to.be.a('object').that.includes.all.keys('user_info', 'content')
    expect(item.user_info).to.be.a('object').and.have.a.property('avatar')
    commonValidate.poster(item.user_info.avatar)
    expect(item.content).to.be.a('object').and.have.a.property('text').that.is.a('string')
  })
  commonValidate.date(target.createdAt)
  commonValidate.number(target.glance)
  commonValidate.number(target.hot)
  expect(target.images).to.be.a('array').and.that.lengthOf.above(0)
  target.images.forEach(item => {
    commonValidate.string(item)
  })
  expect(target.info).to.be.a('object').and.that.includes.all.keys(
    'actor', 'another_name', 'classify', 'description', 'director',
    'district', 'language', 'name', 'screen_time'
  )
  const { info: { actor, another_name, classify, description, director, district, language, name, screen_time } } = target
  commonValidate.time(screen_time)
  expect(actor).to.be.a('array').and.that.lengthOf.above(0)
  actor.forEach(item => {
    expect(item).to.be.a('object').and.that.includes.all.keys('name', 'other')
    const { name, other } = item
    commonValidate.string(name)
    expect(other).to.be.a('object').and.that.includes.all.keys('avatar')
    commonValidate.poster(other.avatar)
  })
  expect(another_name).to.be.a('array')
  another_name.forEach(item => commonValidate.string(item))
  expect(classify).to.be.a('array').and.that.lengthOf.above(0)
  classify.forEach(item => {
    expect(item).to.be.a('object').and.that.have.a.property('name').is.a('string').and.that.lengthOf.above(0)
  })
  commonValidate.string(description)
  expect(director).to.be.a('array').and.that.lengthOf.above(0)
  director.forEach(item => {
    expect(item).to.be.a('object').and.that.have.a.property('name').is.a('string').and.that.lengthOf.above(0)
  })
  expect(district).to.be.a('array').and.that.lengthOf.above(0)
  district.forEach(item => {
    expect(item).to.be.a('object').and.that.have.a.property('name').is.a('string').and.that.lengthOf.above(0)
  })
  expect(language).to.be.a('array').and.that.lengthOf.above(0)
  language.forEach(item => {
    expect(item).to.be.a('object').and.that.have.a.property('name').is.a('string').and.that.lengthOf.above(0)
  })
  commonValidate.string(name)
  
  commonValidate.string(target.name)
  commonValidate.poster(target.poster)
  commonValidate.number(target.rate)
  expect(target.same_film).to.be.a('array')
  target.same_film.forEach(item => {
    expect(item).to.be.a('object').and.that.includes.all.keys('name', '_id', 'same_type')
    commonValidate.string(item.name)
    commonValidate.objectId(item._id)
    commonValidate.string(item.same_type, function(target) {
      return ['SERIES', 'NAMESAKE'].indexOf(target.toUpperCase())
    })
  })
  expect(target.store).to.be.a('boolean')
  expect(target.tag).to.be.a('array')
  target.tag.forEach(item => {
    expect(item).to.be.a('object').and.that.have.a.property('text').that.is.a('string').and.that.lengthOf.above(0)
  })
  commonValidate.poster(target.video)
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

  describe(`get the movie detail without self info test -> ${COMMON_API}`, function() {

    let imageDatabase
    let videoDatabase
    let classifyDatabase
    let languageDatabase
    let actorDatabase
    let directorDatabase
    let movieDatabase
    let userDatabase
    let districtDatabase
    let commentDatabase
    let tagDatabase
    let imageId
    let userId
    let result

    before(function(done) {

      const { model:image } = mockCreateImage({
        src: COMMON_API
      })
      imageDatabase = image
      imageDatabase.save()
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
        const { model: tag } = mockCreateTag({
          text: COMMON_API
        })
        const { model: user } = mockCreateUser({
          username: COMMON_API
        })
        videoDatabase = video
        directorDatabase = director
        classifyDatabase = classify
        districtDatabase = district
        actorDatabase = actor
        languageDatabase = language
        tagDatabase = tag
        userDatabase = user
        return Promise.all([
          videoDatabase.save(),
          directorDatabase.save(),
          classifyDatabase.save(),
          districtDatabase.save(),
          actorDatabase.save(),
          languageDatabase.save(),
          tagDatabase.save(),
          userDatabase.save()
        ])
      })
      .then(([video, director, classify, district, actor, language, tag, user]) => {
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
          tag: [ tag._id ],
          author: userId,
          source_type: 'USER'
        })
        movieDatabase = model
        return movieDatabase.save()
      })
      .then(data => {
        result = data
        const { model } = mockCreateComment({
          source: result._id,
          user_info: userId,
          content: {
            text: COMMON_API
          }
        })
        commentDatabase = model
        return commentDatabase.save()
      })
      .then(data => {
        return movieDatabase.updateOne({
          name: COMMON_API
        }, {
          $push: { 
            comment: data._id, 
            related_to: {
              film: result._id,
              related_type: 'CLASSIFY'
            },
            same_film: {
              film: result._id,
              same_type: 'NAMESAKE'
            }
          }
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
        }),
        commentDatabase.deleteOne({
          "content.text": COMMON_API
        }),
        tagDatabase.deleteOne({
          text: COMMON_API
        })
      ])
      .then(function() {
        done()
      })
      .catch(err => {
        console.log('oops: ', err)
      })

    })
    
    describe(`get the movie detail without self info success test -> ${COMMON_API}`, function() {

      it(`get the movie detail without self info success`, function(done) {

        Request
        .get(COMMON_API)
        .query({
          _id: result._id.toString()
        })
        .set({
          Accept: 'Application/json',
        })
        .expect(200)
        .expect({
          'Content-Type': /json/,
        })
        .end(function(err, _) {
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

      it(`get the movie detail without self info success and return the status of 304`, function(done) {

        const query = {
          _id: result._id.toString()
        }

        Request
        .get(COMMON_API)
        .query(query)
        .set({
          Accept: 'Application/json',
          'If-Modified-Since': result.updatedAt,
          'If-None-Match': createEtag(query)
        })
        .expect(304)
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

      it(`get the movie detail without self info success and hope return the status of 304 but the content has edited`, function(done) {

        const query = {
          _id: result._id.toString()
        }

        Request
        .get(COMMON_API)
        .query(query)
        .set({
          Accept: 'Application/json',
          'If-Modified-Since': new Date(Day(result.updatedAt).valueOf - 10000000),
          'If-None-Match': createEtag(query)
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

      it(`get the movie detail without self info success and hope return the status of 304 but the params of query is change`, function(done) {

        const query = {
          offset: 0,
          _id: result._id.toString()
        }

        Request
        .get(COMMON_API)
        .query({
          _id: result._id.toString()
        })
        .set({
          Accept: 'Application/json',
          'If-Modified-Since': new Date(Day(result.updatedAt).valueOf - 10000000),
          'If-None-Match': createEtag(query)
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

    describe(`get the movie detail without self info fail test -> ${COMMON_API}`, function() {
      
      it(`get the movie detail without self info fail bacause the movie id is not found`, function(done) {

        const _id = result._id.toString()

        Request
        .get(COMMON_API)
        .query({
          _id: `${(parseInt(_id.slice(0, 1)) + 5) % 10}${_id.slice(1)}`
        })
        .set({
          Accept: 'Application/json'
        })
        .expect(404)
        .expect({
          'Content-Type': /json/
        })
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

      it(`get the movie detail without self info fail because the movie id is not verify`, function(done) {

        Request
        .get(COMMON_API)
        .query({
          _id: result._id.slice(1)
        })
        .set({
          Accept: 'Application/json'
        })
        .expect(400)
        .expect({
          'Content-Type': /json/
        })
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

      it(`get the movie detail without self info fail because lack the params of the movie id`, function(done) {
        
        Request
        .get(COMMON_API)
        .set({
          Accept: 'Application/json'
        })
        .expect(400)
        .expect({
          'Content-Type': /json/
        })
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

    })

  })

})