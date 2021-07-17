require('module-alias/register')
const { expect } = require('chai')
const { Types: { ObjectId } } = require('mongoose')
const { FriendsModel, FRIEND_STATUS } = require('@src/utils')
const { mockCreateFriends } = require('@test/utils')
const { scheduleMethod, SPACE } = require("@src/utils/schedule/friends/friend_status")

const SCHEDULE_PREFIX = "schedule of unuse friends test"

describe(SCHEDULE_PREFIX, function() {

  before(function(done) {

    const { model } = mockCreateFriends({
      user: ObjectId("8f63270f005f1c1a0d9448ca"),
      friends: [
        {
          _id: ObjectId("8f63270f005f1c1a0d9448ca"),
          timestamps: Date.now() - SPACE - 100,
          status: FRIEND_STATUS.AGREE
        }
      ]
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
      user: isValidObjectId("8f63270f005f1c1a0d9448ca")
    })
    .then(_ => {
      done()
    })
    .catch(err => {
      done(err)
    })
  })

  it(`change agree status friends data`, function(done) {

    scheduleMethod({
      test: true 
    })
    .then(_ => {
      return FriendsModel.findOne({
        user: isValidObjectId("8f63270f005f1c1a0d9448ca"),
        friends: {
          $elemMatch: {
            $and: [
              {
                _id: ObjectId("8f63270f005f1c1a0d9448ca"),
              },
              {
                status: FRIEND_STATUS.NORMAL
              }
            ]
          }
        }
      })
      .select({
        _id: 1
      })
      .exec()
    })
    .then(data => {
      expect(!!data).to.be.true 
    })
    .then(_ => {
      done()
    })
    .catch(err => {
      done(err)
    })

  })

})

