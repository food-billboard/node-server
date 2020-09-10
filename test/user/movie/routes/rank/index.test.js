require('module-alias/register')
const { expect } = require('chai')
const { 
  mockCreateClassify, 
  mockCreateRank, 
  mockCreateMovie, 
  mockCreateImage,
  Request, 
  commonValidate 
} = require('@test/utils')

const COMMON_API = '/api/user/movie/rank'

function responseExpect(res, validate=[]) {
  const { res: { data: target } } = res
         
  expect(target).to.be.a('array')
  target.forEach(item => {
    expect(item).to.be.a('object').and.that.includes.all.keys('poster', 'classify', 'description', 'name', 'publish_time', 'hot', 'author_rate', 'rate', '_id')
    commonValidate.number(item.hot)
    expect(item.like).to.be.a('boolean')
    commonValidate.time(item.publish_time)
    commonValidate.objectId(item._id)
    commonValidate.poster(item.poster)
    commonValidate.string(item.description)
    commonValidate.string(item.name)
    
    expect(item.classify).to.be.a('array')
    item.classify.forEach(cls => commonValidate.string(cls))

    commonValidate.number(item.author_rate)
    commonValidate.number(item.number)
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

  describe(`get rank list test -> ${COMMON_API}`, function() {

    let imageDatabase
    let classifyDatabase
    let movieDatabase
    let rankDatabase
    let imageId
    let classifyId
    let movieId
    let rankId

    before(function(done) {

      const { model: image } = mockCreateImage({
        src: COMMON_API
      })
      const { model: classify } = mockCreateClassify({
        name: COMMON_API
      })

      imageDatabase = image
      classifyDatabase = classify

      Promise.all([
        imageDatabase.save(),
        classifyDatabase.save()
      ])
      .then(([image, classify]) => {
        imageId = image._id
        classifyId = classify._id

        const { model: movie } = mockCreateMovie({
          name: COMMON_API,
          info: {
            classify: [ classifyId ]
          }
        })
        const { model: rank } = mockCreateRank({
          name: COMMON_API,
          match_field: {
            _id: classifyId,
            field: 'classify'
          },
          icon: ImageId
        })

        movieDatabase = movie
        rankDatabase = rank

        return Promise.all([
          movieDatabase.save(),
          rankDatabase.save()
        ])

      })
      .then(function([movie, rank]) {
        movieId = movie._id
        rankId= rank._id
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
        classifyDatabase.deleteOne({
          name: COMMON_API
        }),
        movieDatabase.deleteOne({
          name: COMMON_API
        }),
        rankDatabase.deleteOne({
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
    
    describe(`get rank list success test -> ${COMMON_API}`, function() {

      after(function(done) {
        rankDatabase.findOne({
          name: COMMON_API
        })
        .select({
          glance: 1
        })
        .exec()
        .then(data => !!data && data._doc)
        .then(data => {
          expect(data).to.be.not.a('boolean')
          const { glance } = data
          expect(glance).to.be.a('number').and.that.above(0)
          done()
        })
        .catch(err => {
          console.log('oops: ', err)
        })
      })

      it(`get rank list success`, function(done) {

        Request
        .get(COMMON_API)
        .query({
          _id: rankId.toString()
        })
        .set({
          Accept: 'Application/json'
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

      it(`get rank list success and return the status of 304`, function(done) {

        const query = {
          _id: rankId.toString()
        }

        Request
        .get(COMMON_API)
        .query(query)
        .set({
          Accept: 'Application/json',
          'If-Modified-Since': result.updatedAt,
          'If-None-Match': createEtag(query),
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

      it(`get rank list success and hope return the status of 304 but the content has edited`, function(done) {

        const query = {
          _id: rankId.toString()
        }

        Request
        .get(COMMON_API)
        .query(query)
        .set({
          Accept: 'Application/json',
          'If-Modified-Since': new Date(Day(result.updatedAt).valueOf - 10000000),
          'If-None-Match': createEtag(query),
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

      it(`get rank list success and hope return the status of 304 but the params of query is change`, function(done) {

        const query = {
          _id: rankId.toString()
        }

        Request
        .get(COMMON_API)
        .query(query)
        .set({
          Accept: 'Application/json',
          'If-Modified-Since': new Date(Day(result.updatedAt).valueOf - 10000000),
          'If-None-Match': createEtag({
            _id: rankId.toString(),
            currPage: 0
          }),
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

    describe(`get rank list fail test -> ${COMMON_API}`, function() {

      it(`get rank list fail because the rank id is not found`, function(done) {

        const id = rankId.toString()

        Request
        .get(COMMON_API)
        .query({
          _id: `${(parseInt(id.slice(0, 1)) % 5) % 10}${id.slice(1)}`
        })
        .set({
          Accept: 'Application/json'
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

      it(`get rank list fail because the rank id is not verify`, function(done) {

        Request
        .get(COMMON_API)
        .query({
          _id: rankId.toString().slice(1)
        })
        .set({
          Accept: 'Application/json'
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

      it(`get rank list fail because lack of the params of rank id`, function() {

        Request
        .get(COMMON_API)
        .set({
          Accept: 'Application/json'
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

    })

  })

})