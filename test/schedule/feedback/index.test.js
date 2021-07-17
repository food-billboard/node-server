require('module-alias/register')
const { expect } = require('chai')
const { FeedbackModel, FEEDBACK_STATUS } = require('@src/utils')
const { mockCreateFeedback } = require('@test/utils')
const { scheduleMethod } = require("@src/utils/schedule/feedback")

const SCHEDULE_PREFIX = "schedule of feedback test"

describe(SCHEDULE_PREFIX, function() {

  before(function(done) {

    const { model } = mockCreateFeedback({
      content: {
        text: SCHEDULE_PREFIX
      },
      status: FEEDBACK_STATUS.DEAL,
      updatedAt: Day().subtract(60, 'd').toDate()
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
    FeedbackModel.deleteMany({
      "content.text": SCHEDULE_PREFIX
    })
    .then(_ => {
      done()
    })
    .catch(err => {
      done(err)
    })
  })

  it(`clear dealed feedback data`, function(done) {

    scheduleMethod({
      test: true 
    })
    .then(_ => {
      return FeedbackModel.findOne({
        "content.text": SCHEDULE_PREFIX,
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

