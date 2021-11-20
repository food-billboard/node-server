require('module-alias/register')
const { expect } = require('chai')
const { BehaviourModel } = require('@src/utils')
const { mockCreateBehaviour } = require('@test/utils')
const { scheduleMethod } = require("@src/utils/schedule/behaviour/index.schedule")

const MAX_TIMESTAMPS = 100 

describe(`schedule of behaviour test`, function() {

  before(function(done) {

    Promise.all(new Array(2000).fill(0).map((_, index) => {
      const { model } = mockCreateBehaviour({
        timestamps: index == 0 ? MAX_TIMESTAMPS : MAX_TIMESTAMPS - 1
      })
      return model.save()
    }))
    .then(_ => {
      done()
    })
    .catch(err => {
      done(err)
    })

  })

  after(function(done) {
    BehaviourModel.deleteMany({
      timestamps: {
        $lte: MAX_TIMESTAMPS
      }
    })
    .then(_ => {
      done()
    })
    .catch(err => {
      done(err)
    })
  })

  it(`clear the behaviour data`, function(done) {

    scheduleMethod({
      test: true 
    })
    .then(_ => {
      return BehaviourModel.find({
        timestamps: {
          $lt: MAX_TIMESTAMPS
        }
      })
    })
    .then(data => {
      expect(!!data.length).to.be.false 
    })
    .then(_ => {
      done()
    })
    .catch(err => {
      done(err)
    })

  })

})

