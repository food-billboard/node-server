require('module-alias/register')
const { expect } = require('chai')
const { Types: { ObjectId } } = require('mongoose')
const { FriendsModel } = require('@src/utils')
const { mockCreateFriends } = require('@test/utils')
const { scheduleMethod } = require("@src/utils/schedule/friends")

const SCHEDULE_PREFIX = "schedule of unuse friends test"

describe(SCHEDULE_PREFIX, function() {

  before(function(done) {

    const { model } = mockCreateFriends({
      user: ObjectId("8f63270f005f1c1a0d9448ca")
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
    FriendsModel.deleteMany({
      user: ObjectId("8f63270f005f1c1a0d9448ca")
    })
    .then(_ => {
      done()
    })
    .catch(err => {
      done(err)
    })
  })

  it(`clear unuse friends data`, function(done) {

    scheduleMethod({
      test: true 
    })
    .then(_ => {
      return FriendsModel.findOne({
        user: ObjectId("8f63270f005f1c1a0d9448ca")
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

