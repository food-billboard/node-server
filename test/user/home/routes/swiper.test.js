require('module-alias/register')
const { expect } = require('chai')
const { mockCreateMovie, mockCreateImage, mockCreateSpecial, Request, commonValidate } = require('@test/utils')
const { MovieModel, ImageModel, SpecialModel } = require('@src/utils')

const COMMON_API = '/api/user/home/swiper'

function responseExpect(res, validate=[]) {

  const { res: { data: target } } = res

  expect(target).to.be.a('array')
  target.forEach(item => {
    expect(item).to.be.a('object').and.that.includes.all.keys('poster', '_id', 'type')
    expect(item.poster).to.be.satisfies(function(target) {
      return target == null ? true : (typeof target === 'string' && target.length > 0)
    })
    commonValidate.objectId(item._id)
    expect(item.type).to.be.a('string').and.that.satisfies(function(target) {
      return !!~['movie', 'special'].indexOf(target.toLowerCase())
    })
  })

  if(Array.isArray(validate)) {
    validate.forEach(valid => {
      typeof valid == 'function' && valid(target)
    })
  }else if(typeof validate == 'function') {
    validate(target)
  }
}

describe(`${COMMON_API} test`, function() {

  describe(`get home swiper list test -> ${COMMON_API}`, function() {

    let movieResult
    let specialResult

    before(function(done) {
      const { model: image } = mockCreateImage({
        src: COMMON_API
      })

      image.save()
      .then(function(image) {
        imageId = image._id
        const { model:movie } = mockCreateMovie({
          name: COMMON_API,
          poster: imageId,
        })
        const { model:special } = mockCreateSpecial({
          name: COMMON_API,
          poster: imageId
        })

        return Promise.all([
          movie.save(),
          special.save()
        ])
      })
      .then(function([movie, special]) {
        movieResult = movie
        specialResult = special
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
        SpecialModel.deleteOne({
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

    describe(`get home swiper list success test -> ${COMMON_API}`, function() {

      it(`get home swiper list success`, function(done) {

        Request
        .get(COMMON_API)
        .set('Accept', 'Application/json')
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

  })

})