require('module-alias/register')
const { expect } = require('chai')
const Day = require('dayjs')
const { RoomModel, MemberModel } = require('@src/utils')
const { mockCreateRoom, mockCreateMember } = require('@test/utils')
const { scheduleMethod, MAX_TIMESTAMPS } = require("@src/utils/schedule/unlogin-chat-user/index.schedule")

const SCHEDULE_PREFIX = "schedule of unlogin-chat-user test"

describe.skip(SCHEDULE_PREFIX, function() {

  let memberId 
  let roomId 

  before(function(done) {

    const { model: member } = mockCreateMember({
      sid: SCHEDULE_PREFIX,
      user: undefined
    })
    const { model: room } = mockCreateRoom({
      info: {
        name: SCHEDULE_PREFIX
      }
    })

    Promise.all([
      member.save(),
      room.save()
    ])
    .then(([member, room]) => {
      memberId = member._id 
      roomId = room._id 
      return Promise.all([
        MemberModel.updateOne({
          sid: SCHEDULE_PREFIX
        }, {
          $set: {
            room: [
              roomId
            ],
            updatedAt: Day(Date.now() - MAX_TIMESTAMPS - 100).toDate()
          }
        }),
        RoomModel.updateOne({
          "info.name": SCHEDULE_PREFIX
        }, {
          $set: {
            members: [
              memberId
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
      MemberModel.deleteMany({
        sid: SCHEDULE_PREFIX
      }),
      RoomModel.deleteMany({
        "info.name": SCHEDULE_PREFIX
      })
    ])
    .then(_ => {
      done()
    })
    .catch(err => {
      done(err)
    })
  })

  it(`clear the not register member data`, function(done) {

    scheduleMethod({
      test: true 
    })
    .then(_ => {
      return Promise.all([
        RoomModel.findOne({
          "info.name": SCHEDULE_PREFIX,
          members: {
            $in: [
              memberId
            ]
          }
        })
        .select({
          _id: 1
        })
        .exec(),
        MemberModel.findOne({
          sid: SCHEDULE_PREFIX,
          room: {
            $in: [
              roomId
            ]
          }
        })
        .select({
          _id: 1
        })
        .exec()
      ])
    })
    .then(([room, member]) => {
      expect(!!room).to.be.false 
      expect(!!member).to.be.false 
    })
    .then(_ => {
      done()
    })
    .catch(err => {
      done(err)
    })

  })

})

