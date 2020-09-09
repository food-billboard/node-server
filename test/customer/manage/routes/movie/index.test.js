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
const { MovieModel, UserModel } = require('@src/utils')
const mongoose = require('mongoose')
const { Types: { ObjectId } } = mongoose

const COMMON_API = '/api/customer/manage/movie'

function responseExpect(res, validate=[]) {

  const { res: { data: target } } = res

  expect(target).to.be.a('object').and.that.have.a.property('issue')

  target.issue.forEach(item => {
    
    expect(item).to.be.a('object').and.includes.all.keys('description', 'name', 'poster', '_id', 'store', 'rate', 'classify', 'publish_time', 'hot')
    commonValidate.string(item.description, function() { return true })
    commonValidate.string(item.name)
    commonValidate.poster(item.poster)
    commonValidate.objectId(item._id)
    expect(item.store).to.be.a('boolean')
    commonValidate.number(item.rate)
    //classify
    expect(item.classify).to.be.a('array').and.that.lengthOf.above(0)
    item.forEach(classify => {
      expect(classify).to.be.a('object').and.that.has.a.property('name').and.that.is.a('string')
    })
    commonValidate.time(item.publish_time) 
    commonValidate.number(item.hot)

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
  let classifyId
  let videoId
  let directorId
  let districtId
  let languageId
  let actorId

  let baseData


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

      classifyId = classify._id
      videoId = video._id
      directorId = director._id
      districtId = district._id
      languageId = language._id
      actorId = actor._id
      userId = user._id

      //模板参数
      baseData = {
        video: {
          src: videoId.toString(),
          poster: imageId.toString()
        },
        images: new Array(6).fill(ImageId.toString()),
        info: {
          actor: [ actorId.toString() ],
          director: [ directorId.toString() ],
          district: [ districtId.toString() ],
          language: [ languageId.toString() ],
          description: COMMON_API,
          name: COMMON_API,
          classify: [ classifyId.toString() ],
          screen_time: Date.now(),
          author_rate: 10,
          alias: [ COMMON_API ],
          author_description: COMMON_API
        }
      }

      done()
    })
    .catch(err => {
      console.log('oops: ', err)
    })
  })

  function addMovie() {
    const { model } = mockCreateMovie({
      video: videoId,
      info: {
        name: COMMON_API,
        director: [ directorId ],
        classify: [ classifyId ],
        district: [ districtId ],
        actor: [ actorId ],
        language: [ languageId ]
      },
      name: COMMON_API,
      images: [ imageId ],
      poster: imageId,
      author: userId,
      source_type: 'USER'
    })
    movieDatabase = model
    return movieDatabase.save()
  }

  function removeMovie() {
    return MovieModel.deleteMany({
      name: COMMON_API
    })
  }

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
      MovieModel.deleteMany({
        name: COMMON_API
      }),
      userDatabase.deleteOne({
        username: COMMON_API
      }),
      districtDatabase.deleteOne({
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

  describe(`pre check the uploading movie is valid test -> ${COMMON_API}`, function() {

    describe(`pre check the uploading movie is valid fail test -> ${COMMON_API}`, function() {

      describe(`pre check the uploading movie fail because missing some params -> ${COMMON_API}`, function() {
        
        it(`pre check the uploading movie fail because missing the params of info'name`, function(done) {

          const { info, ...nextData } = baseData
          const { name, ...nextInfo } = info

          Request
          .post(COMMON_API)
          .send({
            ...nextData,
            info: {
              ...nextInfo
            }
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

        it(`pre check the uploading movie fail because missing the params of info'district`, function(done) {
          
          const { info, ...nextData } = baseData
          const { district, ...nextInfo } = info

          Request
          .post(COMMON_API)
          .send({
            ...nextData,
            info: {
              ...nextInfo
            }
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

        it(`pre check the uploading movie fail because missing the params of info'director`, function(done) {
          
          const { info, ...nextData } = baseData
          const { director, ...nextInfo } = info

          Request
          .post(COMMON_API)
          .send({
            ...nextData,
            info: {
              ...nextInfo
            }
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

        it(`pre check the uploading movie fail because missing the params of info'actor`, function(done) {

          const { info, ...nextData } = baseData
          const { actor, ...nextInfo } = info
          
          Request
          .post(COMMON_API)
          .send({
            ...nextData,
            info: {
              ...nextInfo
            }
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

        it(`pre check the uploading movie fail because missing the params of info'classify`, function(done) {
          
          const { info, ...nextData } = baseData
          const { classify, ...nextInfo } = info

          Request
          .post(COMMON_API)
          .send({
            ...nextData,
            info: {
              ...nextInfo
            }
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

        it(`pre check the uploading movie fail because missing the params of info'language`, function(done) {
          
          const { info, ...nextData } = baseData
          const { language, ...nextInfo } = info

          Request
          .post(COMMON_API)
          .send({
            ...nextData,
            info: {
              ...nextInfo
            }
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

        it(`pre check the uploading movie fail because missing the params of info'screen_time`, function(done) {

          const { info, ...nextData } = baseData
          const { screen_time, ...nextInfo } = info
          
          Request
          .post(COMMON_API)
          .send({
            ...nextData,
            info: {
              ...nextInfo
            }
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

        it(`pre check the uploading movie fail because missing the params of info'description`, function(done) {

          const { info, ...nextData } = baseData
          const { description, ...nextInfo } = info
          
          Request
          .post(COMMON_API)
          .send({
            ...nextData,
            info: {
              ...nextInfo
            }
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

        it(`pre check the uploading movie fail because missing the params of info'author_rate`, function(done) {

          const { info, ...nextData } = baseData
          const { author_rate, ...nextInfo } = info
          
          Request
          .post(COMMON_API)
          .send({
            ...nextData,
            info: {
              ...nextInfo
            }
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

        it(`pre check the uploading movie fail because missing the params of video.src`, function(done) {

          const { video, ...nextData } = baseData
          const { src, ...nextVideo } = video
          
          Request
          .post(COMMON_API)
          .send({
            ...nextData,
            video: {
              ...nextVideo
            }
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

        it(`pre check the uploading movie fail because missing the params of video.poster`, function(done) {
          
          const { video, ...nextData } = baseData
          const { poster, ...nextVideo } = video

          Request
          .post(COMMON_API)
          .send({
            ...nextData,
            video: {
              ...nextVideo
            }
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

        it(`pre check the uploading movie fail because missing the params of images`, function(done) {
          
          const { images, ...nextData } = baseData

          Request
          .post(COMMON_API)
          .send({
            ...nextData,
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

      describe(`pre check uploading movie fail because the params is unverify -> ${COMMON_API}`, function() {

        it(`pre check the uploading movie fail because the params of info'name is not verify`, function(done) {

          const { info, ...nextData } = baseData
          const { name, ...nextInfo } = info

          Request
          .post(COMMON_API)
          .send({
            ...nextData,
            info: {
              ...nextInfo,
              name: ''
            }
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

        it(`pre check the uploading movie fail because the params of info'district is not verify`, function(done) {
          

          const { info, ...nextData } = baseData
          const { district, ...nextInfo } = info

          Request
          .post(COMMON_API)
          .send({
            ...nextData,
            info: {
              ...nextInfo,
              district: district.map(item => item.slice(1))
            }
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

        it(`pre check the uploading movie fail because the params of info'director is not verify`, function(done) {

          const { info, ...nextData } = baseData
          const { director, ...nextInfo } = info
          
          Request
          .post(COMMON_API)
          .send({
            ...nextData,
            info: {
              ...nextInfo,
              director: director.map(item => item.slice(1))
            }
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

        it(`pre check the uploading movie fail because the params of info'actor is not verify`, function(done) {

          const { info, ...nextData } = baseData
          const { actor, ...nextInfo } = info
          
          Request
          .post(COMMON_API)
          .send({
            ...nextData,
            info: {
              ...nextInfo,
              actor: actor.map(item => item.slice(1))
            }
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

        it(`pre check the uploading movie fail because the params of info'classify is not verify`, function(done) {
          
          const { info, ...nextData } = baseData
          const { classify, ...nextInfo } = info

          Request
          .post(COMMON_API)
          .send({
            ...nextData,
            info: {
              ...nextInfo,
              classify: classify.map(item => item.slice(1))
            }
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

        it(`pre check the uploading movie fail because the params of info'language is not verify`, function(done) {

          const { info, ...nextData } = baseData
          const { language, ...nextInfo } = info
          
          Request
          .post(COMMON_API)
          .send({
            ...nextData,
            info: {
              ...nextInfo,
              language: language.map(item => item.slice(1))
            }
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

        it(`pre check the uploading movie fail because the params of info'screen_time is not verify`, function(done) {

          const { info, ...nextData } = baseData
          const { screen_time, ...nextInfo } = info
          
          Request
          .post(COMMON_API)
          .send({
            ...nextData,
            info: {
              ...nextInfo,
              screen_time: -100
            }
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

        it(`pre check the uploading movie fail because the params of info'description is not verify`, function(done) {
          
          const { info, ...nextData } = baseData
          const { description, ...nextInfo } = info

          Request
          .post(COMMON_API)
          .send({
            ...nextData,
            info: {
              ...nextInfo,
              description: ''
            }
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

        it(`pre check the uploading movie fail because the params of info'author_rate is not verify`, function(done) {
          
          const { info, ...nextData } = baseData
          const { author_rate, ...nextInfo } = info

          Request
          .post(COMMON_API)
          .send({
            ...nextData,
            info: {
              ...nextInfo,
              author_rate: -10
            }
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

        it(`pre check the uploading movie fail because the params of video.src is not verify`, function(done) {

          const { video, ...nextData } = baseData
          const { src, ...nextVideo } = video
            
          Request
          .post(COMMON_API)
          .send({
            ...nextData,
            video: {
              ...nextVideo,
              src: src.slice(1)
            }
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

        it(`pre check the uploading movie fail because the params of video.poster is not verify`, function(done) {
          
          const { video, ...nextData } = baseData
          const { poster, ...nextVideo } = video

          Request
          .post(COMMON_API)
          .send({
            ...nextData,
            video: {
              ...nextVideo,
              poster: poster.slice(1)
            }
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

        it(`pre check the uploading movie fail because the params of video.poster is not verify`, function(done) {
          
          const { images, ...nextData } = baseData

          Request
          .post(COMMON_API)
          .send({
            ...nextData,
            images: images.map(item => item.slice(1))
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

  describe(`post the new movie test ${COMMON_API}`, function() {

    describe(`post the new movie success test -> ${COMMON_API}`, function() {

      let movieId

      before(function(done) {
        
        addMovie()
        .then(function(data) {
          movieId = data._id
          done()
        })
        .catch(err => {
          console.log('oops: ', err)
        })

      })

      after(function(done) {

        MovieModel.findOne({
          author_rate: 5
        })
        .select({
          _id: 1
        })
        .exec()
        .then(data => !!data && data._id)
        .then(_id => {
          //电影关联是否正确
          return Promise.all([
            MovieModel.findOne({
              author_rate: 10,
              same_film: [
                {
                  film: _id,
                  same_type: 'NAMESAKE'
                }
              ]
            })
            .select({
              _id: 1
            })
            .exec()
            .then(data => !!data && data._id ? true : false),
            UserModel.findOne({
              _id: userId,
            })
            .select({
              issue: 1
            })
            .exec()
            .then(data => !!data && data._doc)
            .then(data => {
              expect(data).to.be.not.a('boolean')
              const { issue } = data
              return issue.length > 1
            })
          ])
        })
        .then(data => {
          expect(data).to.be.a('array')
          data.forEach(item => {
            expect(item).to.be.true
          })
        })
        .then(_ => {
          return removeMovie()
        })
        .then(function() {
          done()
        })
        .catch(err => {
          console.log('oops: ', err)
        })

      })

      it(`post hte new movie success`, function(done) {

        const { info, ...nextData } = baseData
        const { author_rate, screen_time, ...nextInfo } = info

        Request
        .post(COMMON_API)
        .send({
          ...nextData,
          info: {
            ...nextInfo,
            author_rate: 5,
            screen_time: 100000
          }
        })
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect({
          'Content-Type': /json/
        })
        .end(function(err) {
          if(err) return done(err)
          done()
        })

      })

    })

  })

  describe(`put the previous upload movie test ${COMMON_API}`, function() {

    let movieId

    before(function(done) {

      addMovie()
      .then(data => {
        movieId = data._id
        done()
      })
      .catch(err => {
        console.log('oops: ', err)
      })

    })

    describe(`put the previous upload movie success test -> ${COMMON_API}`, function() {

      after(function(done) {

        MovieModel.findOne({
          _id: movieId,
          author_rate: 3
        })
        .select({
          _id: 1
        })
        .exec()
        .then(data => !!data && data._doc)
        .then(data => {
          expect(data).to.be.not.a('boolean') 
          done()
        })
        .catch(err => {
          console.log('oops: ', err)
        })
      
      })

      it(`put the previous upload movie success`, function(done) {

        const { info, ...nextData } = baseData
        const { author_rate, ...nextInfo } = info

        Request
        .put(COMMON_API)
        .send({
          _id: movieId.toString(),
          ...nextData,
          info: {
            ...nextInfo,
            author_rate: 3
          }
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

    describe(`put the previous upload movie fail test -> ${COMMON_API}`, function() {

      it(`put the previous upload movie fail because the movie id is not verify`, function(done) {

        Request
        .put(COMMON_API)
        .send({
          _id: movieId.toString().slice(1),
          ...baseData
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

      it(`put the previous upload movie fail because the movie id is not found`, function(done) {

        const id = movieId.toString()

        Request
        .put(COMMON_API)
        .send({
          _id: `${(parseInt(id.slice(0, 1)) + 5) % 10}${id.slice(1)}`,
          ...baseData
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

      describe(`put the previous upload movie fail about the auth`, function() {

        before(function(done) {

          Promise.all([
            UserModel.updateOne({
              _id: userId
            }, {
              $pull: { issue: movieId }
            }),
            MovieModel.updateOne({
              _id: movieId
            }, {
              author: ObjectId('53102b43bf1044ed8b0ba36b')
            })
          ])
          .then(function() {
            done()
          })
          .catch(err => {
            console.log('oops: ', err)
          })

        })

        it(`put the previous upload movie fail because the movie is not created by this user`, function(done) {

          Request
          .put(COMMON_API)
          .send({
            _id: movieId.toString(),
            ...baseData
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

  describe(`get the previous self upload movie list test ${COMMON_API}`, function() {

    describe(`get the previous self upload movie list success test -> ${COMMON_API}`, function() {

      it(`get the previous self upload movie list success`, function(done) {

        Request
        .get(COMMON_API)
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(200)
        .expect({
          'Content-Type': /json/
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

      it(`get the previous self upload movie list success and return the status of 304`, function(done) {

        const query = {
          pageSize: 10
        }

        Request
        .get(COMMON_API)
        .query(query)
        .set({
          Accept: 'Application/json',
          'If-Modified-Since': result.updatedAt,
          'If-None-Match': createEtag(query),
          Authorization: `Basic ${selfToken}`
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

      it(`get the previous self upload movie list success and hope return the status of 304 but the content has edited`, function(done) {

        const query = {
          pageSize: 10
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

      it(`get the previous self upload movie list success and hope return the status of 304 but the params of query is change`, function(done) {

        const query = {
          pageSize: 10,
          currPage: 3
        }

        Request
        .get(COMMON_API)
        .query(query)
        .set({
          Accept: 'Application/json',
          'If-Modified-Since': new Date(Day(result.updatedAt).valueOf - 10000000),
          'If-None-Match': createEtag({ pageSize: 10 }),
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

  })

}) 