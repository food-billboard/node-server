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
  mockCreateDistrict,
  createEtag
} = require('@test/utils')
const {
  UserModel,
  CommentModel,
  ClassifyModel,
  MovieModel,
  TagModel,
  ImageModel,
  VideoModel,
  ActorModel,
  DirectorModel,
  LanguageModel,
  DistrictModel
} = require('@src/utils')
const Day = require('dayjs')


const COMMON_API = '/api/user/movie/detail'

function responseExpect(res, validate=[]) {

  const { res: { data: target } } = res 

  expect(target).to.be.a('object').and.that.includes.all.keys(
    'author', 'author_description', 'author_rate', 'comment',
    'createdAt', 'updatedAt', 'glance', 'hot', 'images', 'info', 'name',
    'poster', 'rate', 'same_film', 'store', 'tag', 'video', '_id'
  )

  expect(target.author).to.be.a('object').and.that.includes.any.keys("username", "_id", "avatar")
  commonValidate.string(target.author.username)
  commonValidate.poster(target.author.avatar)
  commonValidate.objectId(target.author._id)
  commonValidate.string(target.author_description, function() { return true })
  commonValidate.number(target.author_rate)
  expect(target.comment).to.be.a('array')
  target.comment.forEach(item => {
    expect(item).to.be.a('object').that.includes.all.keys('user_info', 'content', "_id")
    commonValidate.objectId(item._id)
    expect(item.user_info).to.be.a('object').and.have.any.keys('avatar', 'username', 'description')
    commonValidate.poster(item.user_info.avatar)
    commonValidate.string(item.user_info.username)
    commonValidate.objectId(item.user_info._id)
    expect(item.content).to.be.a('object').and.have.a.property('text').that.is.a('string')
  })
  commonValidate.date(target.createdAt)
  commonValidate.date(target.updatedAt)
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
    expect(item).to.be.a('object').and.that.includes.any.keys('name', 'avatar')
    const { name, avatar } = item
    commonValidate.string(name)
    if(avatar != undefined) {
      commonValidate.string(avatar)
    }

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
  commonValidate.string(target.video)
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

    let imageId
    let userId
    let movieId
    let updatedAt
    let result

    before(function(done) {

      const { model:image } = mockCreateImage({
        src: COMMON_API
      })

      image.save()
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
        const { model: tag } = mockCreateTag({
          text: COMMON_API
        })
        const { model: user } = mockCreateUser({
          username: COMMON_API
        })

        return Promise.all([
          video.save(),
          classify.save(),
          district.save(),
          language.save(),
          tag.save(),
          user.save()
        ])
      })
      .then(data => {

        const [,,district] = data

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
      .then(([actor, director, video, classify, district, language, tag, user]) => {
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

        return model.save()
      })
      .then(data => {
        result = data
        movieId = data._id
        const { model } = mockCreateComment({
          source: movieId,
          user_info: userId,
          content: {
            text: COMMON_API
          }
        })

        return model.save()
      })
      .then(data => {
        return MovieModel.updateOne({
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
        MovieModel.deleteMany({
          name: COMMON_API
        }),
        UserModel.deleteOne({
          username: COMMON_API
        }),
        DistrictModel.deleteOne({
          name: COMMON_API
        }),
        CommentModel.deleteOne({
          "content.text": COMMON_API
        }),
        TagModel.deleteOne({
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

      before(async function() {

        updatedAt = await MovieModel.findOne({
          name: COMMON_API
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

      it(`get the movie detail without self info success`, function(done) {

        Request
        .get(COMMON_API)
        .query({
          _id: movieId.toString()
        })
        .set({
          Accept: 'Application/json',
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

      it.skip(`get the movie detail without self info success and return the status of 304`, function(done) {

        const query = {
          _id: movieId.toString()
        }

        Request
        .get(COMMON_API)
        .query(query)
        .set({
          Accept: 'Application/json',
          'If-Modified-Since': updatedAt,
          'If-None-Match': createEtag(query)
        })
        .expect(304)
        .expect('Last-Modified', updatedAt.toString())
        .expect('ETag', createEtag(query))
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

      it.skip(`get the movie detail without self info success and hope return the status of 304 but the content has edited`, function(done) {

        const query = {
          _id: movieId.toString()
        }

        Request
        .get(COMMON_API)
        .query(query)
        .set({
          Accept: 'Application/json',
          'If-Modified-Since': new Date(Day(updatedAt).valueOf - 10000000),
          'If-None-Match': createEtag(query)
        })
        .expect(200)
        .expect('Last-Modified', updatedAt.toString())
        .expect('ETag', createEtag(query))
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

      it.skip(`get the movie detail without self info success and hope return the status of 304 but the params of query is change`, function(done) {

        const query = {
          offset: 0,
          _id: movieId.toString()
        }

        Request
        .get(COMMON_API)
        .query({
          _id: movieId.toString()
        })
        .set({
          Accept: 'Application/json',
          'If-Modified-Since': new Date(Day(result.updatedAt).valueOf - 10000000),
          'If-None-Match': createEtag(query)
        })
        .expect(200)
        .expect('Last-Modified', updatedAt.toString())
        .expect('ETag', createEtag({
          _id: movieId.toString()
        }))
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

    })

    describe(`get the movie detail without self info fail test -> ${COMMON_API}`, function() {
      
      it(`get the movie detail without self info fail bacause the movie id is not found`, function(done) {

        const _id = movieId.toString()

        Request
        .get(COMMON_API)
        .query({
          _id: `${(parseInt(_id.slice(0, 1)) + 5) % 10}${_id.slice(1)}`
        })
        .set({
          Accept: 'Application/json'
        })
        .expect(404)
        .expect('Content-Type', /json/)
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

      it(`get the movie detail without self info fail because the movie id is not verify`, function(done) {

        Request
        .get(COMMON_API)
        .query({
          _id: movieId.toString().slice(1)
        })
        .set({
          Accept: 'Application/json'
        })
        .expect(400)
        .expect('Content-Type', /json/)
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
        .expect('Content-Type', /json/)
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

    })

  })

})