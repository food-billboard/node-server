require('module-alias/register')
const { expect } = require('chai')
const { Types: { ObjectId } } = require('mongoose')
const { SpecialModel } = require('@src/utils')
const { mockCreateSpecial } = require('@test/utils')
const { specialDeal, MAX_COUNT } = require("@src/utils/schedule/browser/special")

const SCHEDULE_PREFIX = "schedule of special test"

describe(SCHEDULE_PREFIX, function() {

  before(function(done) {

    const { model } = mockCreateSpecial({
      description: SCHEDULE_PREFIX,
      glance: new Array(600).fill({
        _id: ObjectId("8f63270f005f1c1a0d9448ca"),
        timestamps: Date.now()
      })
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
    SpecialModel.deleteMany({
      description: SCHEDULE_PREFIX
    })
    .then(_ => {
      done()
    })
    .catch(err => {
      done(err)
    })
  })

  it(`special glance user clear data`, function(done) {

    specialDeal({
      test: true 
    })
    .then(_ => {
      return SpecialModel.findOne({
        description: SCHEDULE_PREFIX,
      })
      .select({
        _id: 1,
        glance: 1
      })
      .exec()
    })
    .then(data => {
      expect(!!data).to.be.true 
      expect(data.glance.length <= MAX_COUNT).to.be.true 
    })
    .then(_ => {
      done()
    })
    .catch(err => {
      done(err)
    })

  })

})

