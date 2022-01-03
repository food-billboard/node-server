require('module-alias/register')
const { expect } = require('chai')
const {
  mockCreateClassify,
  mockCreateRank,
  mockCreateMovie,
  mockCreateImage,
  Request,
  parseResponse,
  commonMovieValid,
  mockCreateUser
} = require('@test/utils')
const { ImageModel, ClassifyModel, MovieModel, RankModel, UserModel } = require('@src/utils')

const COMMON_API = '/api/customer/movie/detail/rank'

function responseExpect (res, validate = []) {
  const { res: { data: target } } = res

  commonMovieValid(target)

  if (Array.isArray(validate)) {
    validate.forEach(valid => {
      typeof valid == 'function' && valid(target)
    })
  } else if (typeof validate === 'function') {
    validate(target)
  }
}

describe(`${COMMON_API} test`, function () {

  describe(`get rank list test -> ${COMMON_API}`, function () {

    let imageId
    let classifyId
    let movieId
    let rankId
    let result
    let selfInfo
    let selfToken
    let updatedAt

    before(function (done) {

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
        .then(([image, classify, user]) => {
          imageId = image._id
          classifyId = classify._id
          selfInfo = user
          selfToken = signToken(selfInfo._id)
          const { model: movie } = mockCreateMovie({
            name: COMMON_API,
            info: {
              classify: [classifyId]
            }
          })
          const { model: rank } = mockCreateRank({
            name: COMMON_API,
            icon: imageId,
            match_field: {
              _id: classifyId,
              field: 'classify'
            }
          })

          return Promise.all([
            movie.save(),
            rank.save()
          ])

        })
        .then(function ([movie, rank]) {
          movieId = movie._id
          rankId = rank._id
          result = rank
          return RankModel.updateOne({
            _id: rankId
          }, {
            $set: {
              match: [
                movieId
              ]
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

    after(function (done) {

      Promise.all([
        ImageModel.deleteOne({
          src: COMMON_API
        }),
        ClassifyModel.deleteOne({
          name: COMMON_API
        }),
        MovieModel.deleteOne({
          name: COMMON_API
        }),
        RankModel.deleteOne({
          name: COMMON_API
        }),
        UserModel.deleteMany({
          username: COMMON_API
        })
      ])
        .then(function () {
          done()
        })
        .catch(err => {
          done(err)
        })

    })

    describe(`get rank list success test -> ${COMMON_API}`, function () {

      before(function (done) {
        RankModel.findOne({
          name: COMMON_API
        })
          .select({
            updatedAt: 1
          })
          .exec()
          .then(data => data.updatedAt)
          .then(data => {
            updatedAt = data
            done()
          })
          .catch(err => {
            done(err)
          })
      })

      after(function (done) {
        RankModel.findOne({
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
            done(err)
          })
      })

      it(`get rank list success`, function (done) {

        Request
          .get(COMMON_API)
          .query({
            _id: rankId.toString()
          })
          .set({
            Accept: 'Application/json',
            Authorization: `Basic ${selfToken}`
          })
          .expect(200)
          .expect('Content-Type', /json/)
          .end(function (err, res) {
            if (err) return done(err)
            let obj = parseResponse(res)
            responseExpect(obj)
            done()
          })

      })

      it(`get special list success and self store it`, function (done) {

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
              .query({ _id: rankId.toString() })
              .set({
                'Accept': 'Application/json',
                Authorization: `Basic ${selfToken}`
              })
              .expect(200)
              .expect('Content-Type', /json/)
          })
          .then(function (res) {
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

    describe(`get rank list fail test -> ${COMMON_API}`, function () {

      it(`get rank list fail because the rank id is not found`, function (done) {

        const id = rankId.toString()

        Request
          .get(COMMON_API)
          .query({
            _id: `${(parseInt(id.slice(0, 1)) % 5) % 10}${id.slice(1)}`
          })
          .set({
            Accept: 'Application/json',
            Authorization: `Basic ${selfToken}`
          })
          .expect(200)
          .expect('Content-Type', /json/)
          .end(function (err, res) {
            if (err) return done(err)
            const obj = parseResponse(res)
            responseExpect(obj, target => {
              expect(target.length).to.be.equal(0) 
            })
            done()
          })

      })

      it(`get rank list fail because the rank id is not verify`, function (done) {

        Request
          .get(COMMON_API)
          .query({
            _id: rankId.toString().slice(1)
          })
          .set({
            Accept: 'Application/json',
            Authorization: `Basic ${selfToken}`
          })
          .expect(400)
          .expect('Content-Type', /json/)
          .end(function (err, _) {
            if (err) return done(err)
            done()
          })

      })

      it(`get rank list fail because lack of the params of rank id`, function (done) {

        Request
          .get(COMMON_API)
          .set({
            Accept: 'Application/json',
            Authorization: `Basic ${selfToken}`
          })
          .expect(400)
          .expect('Content-Type', /json/)
          .end(function (err, _) {
            if (err) return done(err)
            done()
          })

      })

    })

  })

})