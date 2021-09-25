require('module-alias/register')
const { UserModel, RoomModel, MemberModel, ROOM_TYPE } = require('@src/utils')
const { expect } = require('chai')
const { Types: { ObjectId } } = require('mongoose')
const { Request, mockCreateUser, mockCreateMember, mockCreateRoom } = require('@test/utils')

const CONNECT_API = '/api/chat/connect'
const DIS_CONNECT_API = '/api/chat/disconnect'

describe(`${CONNECT_API} test`, function() {

  let userInfo
  let selfToken
  let roomId 
  let memberId 
  let getToken

  before(function(done) {

    const { model: user, signToken } = mockCreateUser({
      username: CONNECT_API,
    })
    getToken = signToken

    user.save()
    .then(user => {
      userInfo = user 
      selfToken = getToken(userInfo._id)
      const { model: memberModel } = mockCreateMember({
        sid: CONNECT_API,
        user: userInfo._id 
      })
      return memberModel.save()
    })
    .then(member => {
      memberId = member._id 
      const { model: userRoom } = mockCreateRoom({
        info: {
          name: CONNECT_API,
        },
        origin: true,
        type: ROOM_TYPE.CHAT,
        members: [memberId]
      })
      return userRoom.save()
    })
    .then(room => {
      roomId = room._id 
      return RoomModel.updateOne({
        _id: roomId
      }, {
        $set: {
          create_user: memberId,
          members: [
            memberId
          ]
        }
      })
    })
    .then(() => {
      done()
    })
    .catch(err => {
      console.log('oops: ', err)
    })

  })

  after(function(done) {

    Promise.all([
      UserModel.deleteMany({
        username: {
          $in: [
            CONNECT_API,
            DIS_CONNECT_API
          ]
        }
      }),
      RoomModel.deleteMany({
        "info.name": {
          $in: [CONNECT_API, DIS_CONNECT_API]
        }
      }),
      MemberModel.deleteMany({
        sid: {
          $in: [
            CONNECT_API,
            DIS_CONNECT_API
          ]
        }
      })
    ])
    .then(_ => {
      done()
    })
    .catch(err => {
      console.log('oops: ', err)
    })

  })

  const valid = async (memberQuery) => {
    return MemberModel.findOne(memberQuery)
    .then((member) => {
      expect(!!member).to.be.true 
    })
  }

  describe(`${CONNECT_API} connect server test`, function() {
      
    describe(`${CONNECT_API} connect server success test`, function() {
      
      it(`connect server success and login`, function(done) {

        MemberModel.updateOne({
          _id: memberId
        }, {
          $set: {
            sid: DIS_CONNECT_API
          }
        })
        .then(() => {
          return Request
          .post(CONNECT_API)
          .send({
            sid: CONNECT_API
          })
          .set({
            Accept: 'Application/json',
            Authorization: `Basic ${selfToken}`
          })
          .expect(200)
          .expect('Content-Type', /json/)
        })
        .then(_ => {
          return valid({
            _id: memberId,
            sid: CONNECT_API
          })
        })
        .then(_ => {
          done()
        })
        .catch(function(err) {
          done(err)
        })

      })

      it(`connect server success and not login`, function(done) {
        
        MemberModel.updateOne({
          _id: memberId
        }, {
          $set: {
            sid: DIS_CONNECT_API,
            temp_user_id: CONNECT_API
          }
        })
        .then(() => {
          return Request
          .post(CONNECT_API)
          .send({
            sid: CONNECT_API,
            temp_user_id: CONNECT_API
          })
          .set({
            Accept: 'Application/json',
          })
          .expect(200)
          .expect('Content-Type', /json/)
        })
        .then(_ => {
          return valid({
            _id: memberId,
            sid: CONNECT_API,
            temp_user_id: CONNECT_API
          })
        })
        .then(_ => {
          done()
        })
        .catch(function(err) {
          done(err)
        })

      })

    })

    describe(`${CONNECT_API} connect server fail test`, function() {

      it(`connect server fail because sid is not exists`, function(done) {
        Request
        .post(CONNECT_API)
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(400)
        .expect('Content-Type', /json/)
        .end(function(err) {
          if(err) return done(err)
          done()
        })
      })

    })

  })

  describe(`${DIS_CONNECT_API} disconnect server test`, function() {
      
    describe(`${DIS_CONNECT_API} disconnect server success test`, function() {
      
      it(`disconnect server success and login`, function(done) {
        
        Promise.all([
          MemberModel.updateOne({
            _id: memberId
          }, {
            $set: {
              sid: DIS_CONNECT_API
            }
          }),
          RoomModel.updateOne({
            _id: roomId
          }, {
            $set: {
              online_members: [memberId]
            }
          })
        ])
        .then(() => {
          return Request
          .post(DIS_CONNECT_API)
          .send({
            sid: DIS_CONNECT_API
          })
          .set({
            Accept: 'Application/json',
            Authorization: `Basic ${selfToken}`
          })
          .expect(200)
          .expect('Content-Type', /json/)
        })
        .then(_ => {
          return valid({
            _id: memberId,
            sid: ''
          })
        })
        .then(_ => {
          return RoomModel.findOne({
            _id: roomId,
            online_members: []
          })
          .select({
            _id: 1,
          })
          .exec()
          .then(data => {
            expect(!!data).to.be.true 
          })
        })
        .then(_ => {
          done()
        })
        .catch(function(err) {
          done(err)
        })

      })

      it(`disconnect server success and not login`, function(done) {
        
        Promise.all([
          MemberModel.updateOne({
            _id: memberId
          }, {
            $set: {
              sid: DIS_CONNECT_API,
              temp_user_id: DIS_CONNECT_API
            }
          }),
          RoomModel.updateOne({
            _id: roomId
          }, {
            $set: {
              online_members: [memberId]
            }
          })
        ])
        .then(() => {
          return Request
          .post(DIS_CONNECT_API)
          .send({
            sid: DIS_CONNECT_API
          })
          .set({
            Accept: 'Application/json',
          })
          .expect(200)
          .expect('Content-Type', /json/)
        })
        .then(_ => {
          return valid({
            _id: memberId,
            sid: '',
            temp_user_id: DIS_CONNECT_API
          })
        })
        .then(_ => {
          return RoomModel.findOne({
            _id: roomId,
            online_members: []
          })
          .select({
            _id: 1,
          })
          .exec()
          .then(data => {
            expect(!!data).to.be.true 
          })
        })
        .then(_ => {
          done()
        })
        .catch(function(err) {
          done(err)
        })

      })

    })

    describe(`${DIS_CONNECT_API} disconnect server fail test`, function() {

      it(`disconnect server fail because sid is not exists`, function(done) {
        Request
        .post(DIS_CONNECT_API)
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(400)
        .expect('Content-Type', /json/)
        .end(function(err) {
          if(err) return done(err)
          done()
        })
      })

    })

  })

})