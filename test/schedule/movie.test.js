require('module-alias/register')
const { expect } = require('chai')
const { Types: { ObjectId } } = require('mongoose')
const { MovieModel } = require('@src/utils')
const { mockCreateMovie } = require('@test/utils')
const { scheduleMethod } = require("@src/utils/schedule/movie")

const SCHEDULE_PREFIX = "schedule of no author movie test"

describe(SCHEDULE_PREFIX, function() {

  before(function(done) {

    const { model } = mockCreateMovie({
      name: SCHEDULE_PREFIX,
      author: ObjectId('8f63270f005f1c1a0d9448ca'),
    })

    model.save()
    .then(_ => {
      done()
    })
    .catch(err => {
      done(err)
    })

  })

  after(function(done) {
    MovieModel.deleteMany({
      name: SCHEDULE_PREFIX
    })
    .then(_ => {
      done()
    })
    .catch(err => {
      done(err)
    })
  })

  it(`clear no author movie data`, function(done) {

    scheduleMethod({
      test: true 
    })
    .then(_ => {
      return MovieModel.findOne({
        name: SCHEDULE_PREFIX
      })
      .select({
        _id: 1
      })
      .exec()
    })
    .then(data => {
      expect(!!data).to.be.false 
    })
    .then(_ => {
      done()
    })
    .catch(err => {
      done(err)
    })

  })

})

