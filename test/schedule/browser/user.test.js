require('module-alias/register')
const { expect } = require('chai')
const { Types: { ObjectId } } = require('mongoose')
const { UserModel, USER_HOT_HISTORY_TYPE } = require('@src/utils')
const { mockCreateUser } = require('@test/utils')
const { userDeal, LIMIT } = require("@src/utils/schedule/browser/user")

const SCHEDULE_PREFIX = "schedule of browser user test"

const MAX = LIMIT + 100

describe(SCHEDULE_PREFIX, function() {

  before(function(done) {

    const { model } = mockCreateUser({
      username: SCHEDULE_PREFIX,
      description: SCHEDULE_PREFIX,
      hot_history: new Array(MAX).fill({
        _id: ObjectId("8f63270f005f1c1a0d9448ca"),
        origin_id: ObjectId("8f63270f005f1c1a0d9448ca"),
        origin_type: USER_HOT_HISTORY_TYPE.comment,
        timestamps: Date.now()
      }),
      glance: new Array(MAX).fill({
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
    UserModel.deleteMany({
      username: SCHEDULE_PREFIX
    })
    .then(_ => {
      done()
    })
    .catch(err => {
      done(err)
    })
  })

  it(`user glance and hot clear data`, function(done) {

    userDeal()
    .then(_ => {
      return UserModel.findOne({
        username: SCHEDULE_PREFIX,
        $and: [
          {
            [`glance.${LIMIT + 1}`]: {
              $exists: false 
            }
          },
          {
            [`hot_history.${LIMIT + 1}`]: {
              $exists: false 
            }
          },
        ]
      })
      .select({
        _id: 1,
        glance: 1,
        hot_history: 1
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

