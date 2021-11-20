require('module-alias/register')
const { expect } = require('chai')
const Day = require('dayjs')
const { FriendsModel, MemberModel, UserModel } = require('@src/utils')
const { mockCreateFriends, mockCreateMember, mockCreateUser } = require('@test/utils')
const { scheduleMethod } = require("@src/utils/schedule/unlogin-chat-user/un-generate-user.schedule")

const SCHEDULE_PREFIX = "schedule of un-generate-user test"

describe(SCHEDULE_PREFIX, function() {

  after(function(done) {
    Promise.all([
      MemberModel.deleteMany({
        sid: SCHEDULE_PREFIX
      }),
      UserModel.deleteMany({
        username: SCHEDULE_PREFIX
      }),
    ])
    .then(_ => {
      done()
    })
    .catch(err => {
      done(err)
    })
  })

  describe(`${SCHEDULE_PREFIX} success`, function() {

    it(`generate not exists member and friends data`, function(done) {

      let userId 

      const { model } = mockCreateUser({
        username: SCHEDULE_PREFIX
      })
      model.save()
      .then(data => {
        userId = data._id
        return scheduleMethod({
          test: true 
        })
      })
      .then(_ => {
        return Promise.all([
          FriendsModel.findOne({
            user: userId
          })
          .select({
            _id: 1
          })
          .exec(),
          MemberModel.findOne({
            user: userId
          })
          .select({
            _id: 1
          })
          .exec()
        ])
      })
      .then(([friends, member]) => {
        expect(!!friends).to.be.true 
        expect(!!member).to.be.true 
        const { _id } = friends 
        return UserModel.findOne({
          friend_id: _id,
          _id: userId
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
        return Promise.all([
          UserModel.deleteMany({
            username: SCHEDULE_PREFIX
          }),
          FriendsModel.deleteMany({
            user: userId
          }),
          MemberModel.deleteMany({
            user: userId
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

    it(`generate not exists member and friends exists data`, function(done) {

      let userId 
      let friendsId

      const { model } = mockCreateUser({
        username: SCHEDULE_PREFIX
      })
      const { model: friends } = mockCreateFriends({})
      
      Promise.all([
        model.save(),
        friends.save()
      ])
      .then(([user, friends]) => {
        userId = user._id
        friendsId = friends._id 
        return Promise.all([
          UserModel.updateOne({
            username: SCHEDULE_PREFIX
          }, {
            $set: {
              friend_id: friendsId
            }
          }),
          FriendsModel.updateOne({
            _id: friendsId
          }, {
            $set: {
              user: userId
            }
          })
        ])
      })
      .then(_ => {
        return scheduleMethod({
          test: true 
        })
      })
      .then(_ => {
        return MemberModel.findOne({
          user: userId
        })
        .select({
          _id: 1
        })
        .exec()
      })
      .then(data => {
        expect(!!data).to.be.true 
        const { _id } = data 
        return Promise.all([
          UserModel.findOne({
            friend_id: friendsId,
            _id: userId
          })
          .select({
            _id: 1
          })
          .exec(),
          FriendsModel.findOne({
            user: userId,
            member: _id 
          })
          .select({
            _id: 1
          })
          .exec()
        ])
      })
      .then(([user, friends]) => {
        expect(!!user).to.be.true 
        expect(!!friends).to.be.true 
      })
      .then(_ => {
        return Promise.all([
          UserModel.deleteMany({
            username: SCHEDULE_PREFIX
          }),
          FriendsModel.deleteMany({
            user: userId
          }),
          MemberModel.deleteMany({
            user: userId
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

    it(`generate not exists friends and member exists data`, function(done) {

      let userId 
      let memberId

      const { model } = mockCreateUser({
        username: SCHEDULE_PREFIX
      })
      const { model: member } = mockCreateMember({
        sid: SCHEDULE_PREFIX
      })
      
      Promise.all([
        model.save(),
        member.save()
      ])
      .then(([user, member]) => {
        userId = user._id
        memberId = member._id 
        return MemberModel.updateOne({
          _id: memberId
        }, {
          $set: {
            user: userId
          }
        })
      })
      .then(_ => {
        return scheduleMethod({
          test: true 
        })
      })
      .then(_ => {
        return FriendsModel.findOne({
          user: userId
        })
        .select({
          _id: 1
        })
        .exec()
      })
      .then(data => {
        expect(!!data).to.be.true 
        const { _id } = data 
        return Promise.all([
          UserModel.findOne({
            friend_id: _id,
            _id: userId
          })
          .select({
            _id: 1
          })
          .exec(),
          FriendsModel.findOne({
            user: userId,
            member: memberId 
          })
          .select({
            _id: 1
          })
          .exec(),
          MemberModel.findOne({
            user: userId,
          })
          .select({
            _id: 1
          })
          .exec()
        ])
      })
      .then(([user, friends, member]) => {
        expect(!!user).to.be.true 
        expect(!!friends).to.be.true 
        expect(!!member).to.be.true 
      })
      .then(_ => {
        return Promise.all([
          UserModel.deleteMany({
            username: SCHEDULE_PREFIX
          }),
          FriendsModel.deleteMany({
            user: userId
          }),
          MemberModel.deleteMany({
            user: userId
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

  })

})

