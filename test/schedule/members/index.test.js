require('module-alias/register')
const { expect } = require('chai')
const { Types: { ObjectId } } = require('mongoose')
const { MemberModel } = require('@src/utils')
const { mockCreateMember } = require('@test/utils')
const { scheduleMethod } = require("@src/utils/schedule/members")

const SCHEDULE_PREFIX = "schedule of unuse member test"

describe(SCHEDULE_PREFIX, function() {

  before(function(done) {

    const { model } = mockCreateMember({
      user: ObjectId("8f63270f005f1c1a0d9448ca"),
      sid: SCHEDULE_PREFIX
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
    MemberModel.deleteMany({
      sid: SCHEDULE_PREFIX
    })
    .then(_ => {
      done()
    })
    .catch(err => {
      done(err)
    })
  })

  it(`clear unuse member data`, function(done) {

    scheduleMethod({
      test: true 
    })
    .then(_ => {
      return MemberModel.findOne({
        sid: SCHEDULE_PREFIX
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

