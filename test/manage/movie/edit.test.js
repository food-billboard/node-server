require('module-alias/register')
const { 
  MovieModel,
  UserModel, 
  ClassifyModel, 
  ImageModel,
  VideoModel,
  ActorModel,
  DistrictModel,
  DirectorModel,
  LanguageModel,

} = require('@src/utils')
const { expect } = require('chai')
const { 
  Request, 
  commonValidate, 
  mockCreateMovie,
  mockCreateClassify, 
  mockCreateUser, 
  mockCreateImage,
  mockCreateVideo,
  mockCreateDirector,
  mockCreateDistrict,
  mockCreateActor,
  mockCreateLanguage,

} = require('@test/utils')
const { Types: { ObjectId } } = require("mongoose")

const COMMON_API = '/api/manage/movie/edit'

function responseExpect(res, validate=[]) {
  const { res: { data: target } } = res

  expect(target).to.be.a('object').and.that.include.all.keys("_id", "name", "classify", "actor", "director", "district", "language", "alias", "screen_time", "description", "images", "poster", "video", "author_description", "author_rate")
  const { screen_time, description, _id, name, video, alias, poster, updatedAt, author_description, author_rate, images, ...nextInfo } = target
  commonValidate.objectId(_id)
  commonValidate.string(name)
  commonValidate.time(screen_time)
  commonValidate.string(description)
  commonValidate.string(author_description)
  commonValidate.poster(video)
  commonValidate.poster(poster)
  commonValidate.number(author_rate)
  expect(alias).to.be.a('array')
  alias.forEach(item => commonValidate.string(item))
  expect(images).to.be.a('array')
  images.forEach(item => commonValidate.string(item))
  Object.values(nextInfo).forEach(item => {
    expect(item).to.be.a('array')
    item.forEach(i => {
      commonValidate.objectId(i)
    })
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

  let imageId
  let userId
  let selfToken
  let classifyId
  let videoId
  let directorId
  let districtId
  let languageId
  let actorId
  let movieId
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
    .then(([video, classify, district, language, user]) => {

      classifyId = classify._id
      videoId = video._id
      districtId = district._id
      languageId = language._id
      userId = user._id
      selfToken = getToken(userId)

      const { model: actor } = mockCreateActor({
        name: COMMON_API,
        other: {
          avatar: imageId
        },
        country: districtId
      })
      const { model: director } = mockCreateDirector({
        name: COMMON_API,
        country: districtId
      })

      return Promise.all([
        actor.save(),
        director.save(),
      ])

    })
    .then(([actor, director]) => {

      actorId = actor._id
      directorId = director._id

      const { model } = mockCreateMovie({
        name: COMMON_API,
        video: videoId,
        poster: imageId,
        info: {
          name: COMMON_API,
          actor: [ actorId ],
          director: [ directorId ],
          district: [ districtId ],
          language: [ languageId ],
          description: COMMON_API,
          classify: [ classifyId ],
          screen_time: Date.now(),
          another_name: [ COMMON_API ],
        },
        images: new Array(6).fill(imageId),
        author_description: COMMON_API,
        author_rate: 10,
      })

      return model.save()

    })
    .then(data => {
      movieId = data._id
    })
    .catch(err => {
      console.log('oops: ', err)
    })

    return Promise.resolve()
  
  })

  after(async function() {

    await Promise.all([
      ImageModel.deleteMany({
        src: COMMON_API
      }),
      VideoModel.deleteMany({
        src: COMMON_API
      }),
      ClassifyModel.deleteMany({
        name: COMMON_API
      }),
      LanguageModel.deleteMany({
        name: COMMON_API
      }),
      ActorModel.deleteMany({
        name: COMMON_API
      }),
      DirectorModel.deleteMany({
        name: COMMON_API
      }),
      MovieModel.deleteMany({
        name: COMMON_API
      }),
      UserModel.deleteMany({
        username: COMMON_API
      }),
      DistrictModel.deleteMany({
        name: COMMON_API
      })
    ])
    .catch(err => {
      console.log('oops: ', err)
    })

    return Promise.resolve()

  })

  describe(`get the movie info success test -> ${COMMON_API}`, function() {

    it(`get the movie info success`, function(done) {

      Request
      .get(COMMON_API)
      .query({
        _id: movieId.toString()
      })
      .set({
        Accept: 'application/json',
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

  })

  describe(`get the movie info fail test -> ${COMMON_API}`, function() {

    it(`get the movie info fail because lack of the id`, function(done) {

      Request
      .get(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .expect(400)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        done()
      })

    })

    it(`get the movie info fail because the movie id is not found`, function(done) {

      const id = movieId.toString()

      Request
      .get(COMMON_API)
      .query({
        _id: `${id.slice(1)}${Math.ceil(10 / (parseInt(id.slice(0, 1) + 5)))}`
      })
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .expect(404)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        done()
      })

    })

    it(`get the movie info fail because the movie id is not verify`, function(done) {

      Request
      .get(COMMON_API)
      .query({
        _id: movieId.toString().slice(1)
      })
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .expect(400)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        done()
      })

    })

  })

})