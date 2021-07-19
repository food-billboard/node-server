require('module-alias/register')
const { expect } = require('chai')
const { MovieModel, RankModel, ClassifyModel } = require('@src/utils')
const { mockCreateMovie, mockCreateRank, mockCreateClassify } = require('@test/utils')
const { scheduleMethod } = require("@src/utils/schedule/rank")
const { STATIC_RANK_MAP } = require("@src/utils/schedule/rank/static")

const STATIC_COUNT = STATIC_RANK_MAP.length

const SCHEDULE_PREFIX = "schedule of rank test"

describe(SCHEDULE_PREFIX, function() {

  let classifyId 
  let movieId 

  before(function(done) {

    const { model: movie } = mockCreateMovie({
      name: SCHEDULE_PREFIX
    })
    const { model: classify } = mockCreateClassify({
      name: SCHEDULE_PREFIX
    })

    Promise.all([
      movie.save(),
      classify.save(),
    ])
    .then(([movie, classify]) => {
      classifyId = classify._id 
      movieId = movie._id 
      return Promise.all([
        MovieModel.updateMany({
          name: SCHEDULE_PREFIX
        }, {
          $set: {
            "info.classify": [
              classifyId
            ]
          }
        })
      ])
    })
    .then(_ => {
      done()
    })
    .catch(err => {
      done(err)
    })

  })

  after(function(done) {
    Promise.all([
      MovieModel.deleteMany({
        name: SCHEDULE_PREFIX
      }),
      ClassifyModel.deleteMany({
        name: SCHEDULE_PREFIX
      })
    ])
    .then(_ => {
      done()
    })
    .catch(err => {
      done(err)
    })
  })

  it(`update rank data`, function(done) {

    scheduleMethod({
      test: true 
    })
    .then(_ => {
      return Promise.all([
        MovieModel.findOne({
          _id: movieId,
          "info.classify": {
            $in: classifyId
          }
        })
        .select({
          _id: 1
        })
        .exec(),
        RankModel.find({
          name: SCHEDULE_PREFIX,
          match: {
            $in: [
              movieId
            ]
          }
        })
        .select({
          match_pattern: 1,
          _id: 1
        })
        .exec()
      ])
    })
    .then(([movie, rank]) => {
      expect(!!movie).to.be.true 
      expect(rank.length === 1).to.be.true 
      const [ { match_pattern } ] = rank
      const [ { origin_id, origin } ] = match_pattern
      expect(classifyId.equals(origin_id)).to.be.true 
      expect(origin === 'classify').to.be.true 
      return rank
    })
    .then(_ => {
      return RankModel.deleteMany({
        name: SCHEDULE_PREFIX
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

