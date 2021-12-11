require('module-alias/register')
const { expect } = require('chai')
const { mockCreateUser, mockCreateMovie, mockCreateImage, mockCreateSpecial, mockCreateClassify, Request, parseResponse, commonValidate, commonMovieValid } = require('@test/utils')
const { MovieModel, ImageModel, SpecialModel, ClassifyModel, UserModel } = require('@src/utils')

const COMMON_API = '/api/customer/movie/detail/special'

function responseExpect(res, validate=[]) {

  const { res: { data: target } } = res

  expect(target).to.be.a('object').and.that.includes.all.keys('poster', 'movie', 'name', '_id')
  commonValidate.poster(target.poster)
  commonValidate.string(target.name)
  commonValidate.objectId(target._id)
  
  expect(target.movie).to.be.a('array')

  commonMovieValid(target.movie)

  if(Array.isArray(validate)) {
    validate.forEach(valid => {
      typeof valid == 'function' && valid(target)
    })
  }else if(typeof validate == 'function') {
    validate(target)
  }
}

describe(`${COMMON_API} test`, function() {

  describe(`get special list test -> ${COMMON_API}`, function() {

    let imageId
    let result
    let selfInfo 
    let selfToken
    let movieId 
    let resultTest

    before(function(done) {

      const { model: user, signToken } = mockCreateUser({
        username: COMMON_API
      })

      const { model: image } = mockCreateImage({
        src: COMMON_API
      })
      const { model: classify } = mockCreateClassify({
        name: COMMON_API
      })

      Promise.all([
        image.save(),
        classify.save(),
        user.save()
      ])
      .then(function([image, classify, user]) {
        imageId = image._id
        selfInfo = user 
        selfToken = signToken(selfInfo._id)
        const { model } = mockCreateMovie({
          name: COMMON_API,
          poster: imageId,
          info: {
            classify: [ classify._id ]
          },
          images: [imageId],
          author: selfInfo._id 
        })

        return model.save()
      })
      .then(function(data) {
        movieId = data._id 
        const { model } = mockCreateSpecial({
          movie: data._id,
          poster: imageId,
          name: COMMON_API,
          valid: true 
        })
        const { model: testModel } = mockCreateSpecial({
          name: `${COMMON_API}-test`,
          poster: imageId,
          valid: true 
        })

        return Promise.all([
          model.save(),
          testModel.save()
        ])
      })
      .then(function([data, testData]) {
        result = data
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
        MovieModel.deleteMany({
          name: COMMON_API
        }),
        SpecialModel.deleteMany({
          $or: [
            {
              name: COMMON_API
            },
            {
              name: `${COMMON_API}-test`
            }
          ]
        }),
        ClassifyModel.deleteOne({
          name: COMMON_API
        }),
        UserModel.deleteMany({
          username: COMMON_API
        })
      ])
      .then(function() {
        done()
      })
      .catch(err => {
        console.log('oops: ', err)
      })
    })

    describe(`get special list success test -> ${COMMON_API}`, function() {

      it(`get special list success`, function(done) {

        Request
        .get(COMMON_API)
        .query({ _id: result._id.toString() })
        .set({
          'Accept': 'Application/json',
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

      it(`get special list success and self store it`, function(done) {

        UserModel.updateOne({
          _id: selfInfo._id 
        }, {
          $set: {
            store: [
              {
                timestamps: 100,
                _id: movieId
              }
            ]
          }
        })
        .then(_ => {
          return Request
          .get(COMMON_API)
          .query({ _id: result._id.toString() })
          .set({
            'Accept': 'Application/json',
            Authorization: `Basic ${selfToken}`
          })
          .expect(200)
          .expect('Content-Type', /json/)
        })
        .then(function(res) {
          let obj = parseResponse(res)
          responseExpect(obj, target => {
            expect(target.movie.some(item => {
              return item._id === movieId.toString() && item.store
            })).to.be.true 
          })
        })
        .then(_ => {
          return UserModel.updateOne({
            _id: selfInfo._id 
          }, {
            $set: {
              store: []
            }
          })
        })
        .then(_ => {
          done()
        })
        .catch(err => {
          done(err)
        })

      })

    })

    describe(`get special list fail test -> ${COMMON_API}`, function() {

      it(`get special list fail because the special id is not verify`, function(done) {

        Request
        .get(COMMON_API)
        .query({ _id: result._id.toString().slice(1) })
        .set({
          'Accept': 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(400)
        .expect('Content-Type', /json/)
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })
      
      it(`get special list fail because the special id is not found`, function(done) {

        const { _id } = result

        Request
        .get(COMMON_API)
        .query({ _id: `${(parseInt(_id.toString().slice(0, 1)) + 5) % 10}${_id.toString().slice(1)}` })
        .set({
          'Accept': 'Application/json',
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