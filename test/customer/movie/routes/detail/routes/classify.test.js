require('module-alias/register')
const { expect } = require('chai')
const { mockCreateUser, mockCreateMovie, mockCreateImage, mockCreateClassify, Request, parseResponse, commonValidate, commonMovieValid } = require('@test/utils')
const { MovieModel, ImageModel, ClassifyModel, UserModel } = require('@src/utils')

const COMMON_API = '/api/customer/movie/detail/classify'

function responseExpect(res, validate=[]) {

  const { res: { data: target } } = res
  
  expect(target).to.be.a('array')

  commonMovieValid(target)

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
    let classifyId

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
        classifyId = classify._id 
        selfInfo = user 
        selfToken = signToken(selfInfo._id)
        const { model } = mockCreateMovie({
          name: COMMON_API,
          poster: imageId,
          info: {
            classify: [ classifyId ]
          },
          images: [imageId],
          author: selfInfo._id 
        })

        return model.save()
      })
      .then(function(data) {
        movieId = data._id 
      })
      .then(function() {
        done()
      })
      .catch(err => {
        done(err)
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

    describe(`get classify list success test -> ${COMMON_API}`, function() {

      it(`get classify list success`, function(done) {

        Request
        .get(COMMON_API)
        .query({ _id: classifyId.toString() })
        .set({
          'Accept': 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if(err) return done(err)
          let obj = parseResponse(res)
          responseExpect(obj)
          done()
        })

      })

      it(`get classify list success and self store it`, function(done) {

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
          .query({ _id: classifyId.toString() })
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
            expect(target.some(item => {
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

    describe(`get classify list fail test -> ${COMMON_API}`, function() {

      it(`get classify list fail because the classify id is not verify`, function(done) {

        Request
        .get(COMMON_API)
        .query({ _id: classifyId.toString().slice(1) })
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
      
      it(`get classify list fail because the classify id is not found`, function(done) {

        Request
        .get(COMMON_API)
        .query({ _id: `${(parseInt(classifyId.toString().slice(0, 1)) + 5) % 10}${classifyId.toString().slice(1)}` })
        .set({
          'Accept': 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if(err) return done(err)
          const obj = parseResponse(res)
          responseExpect(obj, target => {
            expect(target.length).to.be.equal(0) 
          })
          done()
        })
      })

    })

  })

})