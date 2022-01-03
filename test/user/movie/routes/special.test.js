require('module-alias/register')
const { expect } = require('chai')
const { mockCreateMovie, mockCreateSpecial, Request, commonValidate, parseResponse } = require('@test/utils')
const { SpecialModel, MovieModel } = require('@src/utils')

const COMMON_API = '/api/user/movie/special'

function responseExpect (res, validate = []) {

  const { res: { data: target } } = res

  expect(target).to.be.a('array')
  target.forEach(item => {
    expect(item).to.be.a('object').and.that.includes.all.keys('name', '_id', 'description', 'glance_count', 'poster', 'createdAt', 'updatedAt', 'movie_count')
    commonValidate.string(item.name)
    commonValidate.string(item.description)
    commonValidate.objectId(item._id)
    expect(item.glance_count).to.be.a('number')
    expect(item.movie_count).to.be.a('number')
    commonValidate.date(item.createdAt)
    commonValidate.date(item.updatedAt)
    commonValidate.poster(item.poster)
  })

  if (Array.isArray(validate)) {
    validate.forEach(valid => {
      typeof valid == 'function' && valid(target)
    })
  } else if (typeof validate == 'function') {
    validate(target)
  }
}

describe(`${COMMON_API} test`, function () {

  describe(`get actor list test -> ${COMMON_API}`, function () {

    let result

    before(function (done) {

      const { model } = mockCreateMovie({
        name: COMMON_API
      })

      model.save()
        .then(data => {
          const { model } = mockCreateSpecial({
            name: COMMON_API,
            movie: [
              data._id 
            ]
          })
          return model.save()
        })
        .then(function (data) {
          done()
        })
        .catch(err => {
          done(err)
        })
    })

    after(function (done) {
      Promise.all([
        MovieModel.deleteOne({
          name: COMMON_API
        }),
        SpecialModel.deleteMany({
          name: COMMON_API
        })
      ])
        .then(function () {
          done()
        })
        .catch(err => {
          done(err)
        })
    })

    it(`get actor list success`, function (done) {

      Request
        .get(COMMON_API)
        .set({
          Accept: 'Application/json'
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function (err, res) {
          if (err) return done(err)
          const obj =  parseResponse(res)
          responseExpect(obj)
          done()
        })

    })

  })

})