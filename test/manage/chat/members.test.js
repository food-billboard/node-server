require('module-alias/register')
const { UserModel, ImageModel, RoomModel, MemberModel, ROOM_TYPE, parseData } = require('@src/utils')
const { expect } = require('chai')
const { Request, commonValidate, mockCreateUser, mockCreateImage, mockCreateRoom, mockCreateMember, envSet, envUnSet } = require('@test/utils')

const COMMON_API = '/api/manage/chat/member'

function responseExpect(res, validate=[]) {
  const { res: { data: target } } = res
  expect(target).to.be.a('object').and.that.include.all.keys('total', 'list')
  commonValidate.number(target.total)
  target.list.forEach(item => {
    expect(item).to.be.a('object').and.that.includes.any.keys('user', 'room', 'sid', 'createdAt', 'updatedAt', '_id', 'temp_user_id')
    if(item.sid) {
      commonValidate.string(item.sid)
    }
    if(item.temp_user_id) {
      commonValidate.string(item.temp_user_id)
    }
    commonValidate.objectId(item._id)
    commonValidate.date(item.createdAt)
    commonValidate.date(item.updatedAt)
    if(item.user) {
      expect(item.user).to.be.a('object').and.that.includes.any.keys('username', 'avatar', '_id', 'description', 'friend_id')
      commonValidate.string(item.user.description)
      commonValidate.string(item.user.username)
      if(item.user.avatar) {
        commonValidate.string(item.user.avatar)
      }
      commonValidate.objectId(item.user._id)
      commonValidate.objectId(item.user.friend_id)
    }
    expect(item.room).to.be.a('array')
    item.room.forEach(item => {
      expect(item).to.be.a('object').and.that.includes.any.keys('name', 'description', '_id')
      commonValidate.string(item.description)
      commonValidate.string(item.name)
      commonValidate.objectId(item._id)
    })
  })

  if(Array.isArray(validate)) {
    validate.forEach(valid => {
      typeof valid == 'function' && valid(target)
    })
  }else if(typeof validate === 'function') {
    validate(target)
  }
}

describe(`${COMMON_API} test`, function() {

  let userInfo
  let selfToken
  let roomId 
  let systemRoomId 
  let memberId 
  let imageId 
  let getToken

  before(function(done) {

    const { model: image } = mockCreateImage({
      src: COMMON_API
    })

    image.save()
    .then(image => {
      imageId = image._id
      const { model: user, signToken } = mockCreateUser({
        username: COMMON_API,
        avatar: imageId
      })
      getToken = signToken
      return user.save()
    })
    .then(user => {
      userInfo = user 
      selfToken = getToken(userInfo._id)
      const { model: memberModel } = mockCreateMember({
        sid: COMMON_API,
        user: userInfo._id 
      })
      return memberModel.save()
    })
    .then(member => {
      memberId = member._id 
      const { model: systemRoom } = mockCreateRoom({
        info: {
          name: COMMON_API,
        },
        origin: true,
        type: ROOM_TYPE.SYSTEM,
        create_user: memberId,
        members: [memberId]
      })
      const { model: userRoom } = mockCreateRoom({
        info: {
          name: COMMON_API,
        },
        origin: false,
        type: ROOM_TYPE.CHAT,
        create_user: memberId,
        members: [memberId]
      })
      return Promise.all([
        systemRoom.save(),
        userRoom.save(),
      ])
    })
    .then(([system, user]) => {
      systemRoomId = system._id 
      roomId = user._id 
      return Promise.all([
        MemberModel.updateOne({
          _id: memberId
        }, {
          $set: {
            room: [systemRoomId, roomId]
          }
        }),
      ])
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
        username: COMMON_API
      }),
      MemberModel.deleteMany({
        sid: COMMON_API
      }),
      RoomModel.deleteMany({
        $or: [
          {
            "info.name": COMMON_API
          },
          {
            "info.description": COMMON_API
          }
        ]
      }),
      ImageModel.deleteMany({
        src: COMMON_API
      })
    ])
    .then(_ => {
      done()
    })
    .catch(err => {
      console.log('oops: ', err)
    })

  })

  describe(`${COMMON_API} get member list test`, function() {
      
    describe(`${COMMON_API} get member list success test`, function() {
      
      it(`get member list success`, function(done) {

        Request
        .get(COMMON_API)
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if(err) return done(err)
          const { res: { text } } = res
          let obj
          try{
            obj = JSON.parse(text)
          }catch(_) {
            console.log(_)
            return done(err)
          }
          responseExpect(obj, target => {
            expect(target.list.length).to.not.be.equals(0)
          })
          done()
        })

      })

      it(`get member list success with room`, function(done) {

        Request
        .get(COMMON_API)
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .query({
          room: roomId.toString()
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if(err) return done(err)
          const { res: { text } } = res
          let obj
          try{
            obj = JSON.parse(text)
          }catch(_) {
            console.log(_)
            return done(err)
          }
          responseExpect(obj, target => {
            expect(target.list.length).to.not.be.equals(0)
            expect(target.list.every(item => item.room.some(item => roomId.equals(item._id)))).to.be.true 
          })
          done()
        })

      })

      it(`get member list success with _id`, function(done) {

        Request
        .get(COMMON_API)
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .query({
          _id: memberId.toString()
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if(err) return done(err)
          const { res: { text } } = res
          let obj
          try{
            obj = JSON.parse(text)
          }catch(_) {
            console.log(_)
            return done(err)
          }
          responseExpect(obj, target => {
            expect(target.list.length).to.not.be.equals(0)
            expect(target.list.every(item => memberId.equals(item._id))).to.be.true 
          })
          done()
        })

      })

    })

  })

  describe(`${COMMON_API} post member test`, function() {
      
    describe(`${COMMON_API} post member success test`, function() {
      
      it(`post member success`, function(done) {
        Promise.all([
          RoomModel.updateOne({
            _id: systemRoomId.toString()
          }, {
            $pull: {
              members: memberId
            }
          }),
          MemberModel.updateOne({
            _id: memberId
          }, {
            $pull: {
              room: systemRoomId
            }
          })
        ])
        .then(_ => {
          return Request
          .post(COMMON_API)
          .send({
            _id: memberId.toString(),
            room: systemRoomId.toString()
          })
          .set({
            Accept: 'Application/json',
            Authorization: `Basic ${selfToken}`
          })
          .expect(200)
          .expect('Content-Type', /json/)
        })
        .then(_ => {
          return Promise.all([
            RoomModel.findOne({
              _id: systemRoomId,
              members: {
                $in: [memberId]
              }
            })
            .select({
              _id: 1
            })
            .exec()
            .then(parseData),
            MemberModel.findOne({
              _id: memberId,
              room: {
                $in: [systemRoomId]
              }
            })
            .select({
              _id: 1
            })
            .exec()
            .then(parseData)
          ])
        })
        .then(([room, member]) => {
          expect(!!room && !!member).to.be.true 
          done()
        })
        .catch(err => {
          done(err)
        })
      })

    })

    describe(`${COMMON_API} post member fail test`, function() {
      
      it(`post the member fail because the user not the auth`, function(done) {

        UserModel.updateOne({
          _id: userInfo
        }, {
          $set: {
            roles: ['SUB_DEVELOPMENT']
          }
        })
        .then(envSet)
        .then(_ => {
          return Request
          .post(COMMON_API)
          .send({
            _id: memberId.toString(),
            room: systemRoomId.toString()
          })
          .set({
            Accept: 'Application/json',
            Authorization: `Basic ${selfToken}`
          })
          .expect(403)
          .expect('Content-Type', /json/)
        })
        .then(_ => {
          return UserModel.updateOne({
            _id: userInfo
          }, {
            $set: {
              roles: ['SUPER_ADMIN']
            }
          })
        })
        .then(envUnSet)
        .then(_ => {
          done()
        })
        .catch(err => {
          console.log('oops: ', err)
          done(err)
        })
      })

      it(`post the member fail because the params of _id is not valid`, function(done) {
        Request
        .post(COMMON_API)
        .send({
          _id: memberId.toString().slice(1),
          room: systemRoomId.toString()
        })
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

      it(`post the member fail because lack of the params of _id`, function(done) {
        Request
        .post(COMMON_API)
        .send({
          room: systemRoomId.toString()
        })
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

      it(`post the member fail because the params of room is not valid`, function(done) {
        Request
        .post(COMMON_API)
        .send({
          _id: memberId.toString(),
          room: systemRoomId.toString().slice(1)
        })
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

      it(`post the member fail because lack of the params of room`, function(done) {
        Request
        .post(COMMON_API)
        .send({
          _id: memberId.toString(),
        })
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

      it(`post the member fail because the room type is not system`, function(done) {
        Request
        .post(COMMON_API)
        .send({
          _id: memberId.toString(),
          room: roomId.toString()
        })
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(404)
        .expect('Content-Type', /json/)
        .end(function(err) {
          if(err) return done(err)
          done()
        })
      })

    })

  })

  describe(`${COMMON_API} delete member test`, function() {
      
    describe(`${COMMON_API} delete member success test`, function() {
      
      it(`delete the member success with member id`, function(done) {
        Promise.all([
          RoomModel.updateOne({
            _id: systemRoomId.toString()
          }, {
            $addToSet: {
              members: memberId
            }
          }),
          MemberModel.updateOne({
            _id: memberId
          }, {
            $addToSet: {
              room: systemRoomId
            }
          })
        ])
        .then(_ => {
          return Request
          .delete(COMMON_API)
          .query({
            _id: memberId.toString(),
            room: systemRoomId.toString()
          })
          .set({
            Accept: 'Application/json',
            Authorization: `Basic ${selfToken}`
          })
          .expect(200)
          .expect('Content-Type', /json/)
        })
        .then(_ => {
          return Promise.all([
            RoomModel.findOneAndUpdate({
              _id: systemRoomId,
              members: {
                $nin: [memberId]
              }
            }, {
              $addToSet: {
                members: memberId
              }
            })
            .select({
              _id: 1
            })
            .exec()
            .then(parseData),
            MemberModel.findOneAndUpdate({
              _id: memberId,
              room: {
                $nin: [systemRoomId]
              }
            }, {
              $addToSet: {
                room: systemRoomId
              }
            })
            .select({
              _id: 1
            })
            .exec()
            .then(parseData)
          ])
        })
        .then(([room, member]) => {
          expect(!!room && !!member).to.be.true 
          done()
        })
        .catch(err => {
          done(err)
        })
      })

      it(`delete the member success with room id`, function(done) {
        Promise.all([
          RoomModel.updateOne({
            _id: systemRoomId.toString()
          }, {
            $addToSet: {
              members: memberId
            }
          }),
          MemberModel.updateOne({
            _id: memberId
          }, {
            $addToSet: {
              room: systemRoomId
            }
          })
        ])
        .then(_ => {
          return Request
          .delete(COMMON_API)
          .query({
            is_delete: 1,
            room: systemRoomId.toString()
          })
          .set({
            Accept: 'Application/json',
            Authorization: `Basic ${selfToken}`
          })
          .expect(200)
          .expect('Content-Type', /json/)
        })
        .then(_ => {
          return Promise.all([
            RoomModel.findOneAndUpdate({
              _id: systemRoomId,
              members: {
                $nin: [memberId]
              }
            }, {
              $addToSet: {
                members: memberId
              }
            })
            .select({
              _id: 1
            })
            .exec()
            .then(parseData),
            MemberModel.findOneAndUpdate({
              _id: memberId,
              room: {
                $nin: [systemRoomId]
              }
            }, {
              $addToSet: {
                room: systemRoomId
              }
            })
            .select({
              _id: 1
            })
            .exec()
            .then(parseData)
          ])
        })
        .then(([room, member]) => {
          expect(!!room && !!member).to.be.true 
          done()
        })
        .catch(err => {
          done(err)
        })
      })

    })

    describe(`${COMMON_API} delete member fail test`, function() {
      
      it(`delete the member fail because the user not the auth`, function(done) {
        UserModel.updateOne({
          _id: userInfo
        }, {
          $set: {
            roles: ['SUB_DEVELOPMENT']
          }
        })
        .then(envSet)
        .then(_ => {
          return Request
          .delete(COMMON_API)
          .query({
            _id: memberId.toString(),
            room: systemRoomId.toString()
          })
          .set({
            Accept: 'Application/json',
            Authorization: `Basic ${selfToken}`
          })
          .expect(403)
          .expect('Content-Type', /json/)
        })
        .then(_ => {
          return UserModel.updateOne({
            _id: userInfo
          }, {
            $set: {
              roles: ['SUPER_ADMIN']
            }
          })
        })
        .then(envUnSet)
        .then(_ => {
          done()
        })
        .catch(err => {
          console.log('oops: ', err)
          done(err)
        })
      })

      it(`delete the member fail because the id is not found`, function(done) {
        const id = memberId.toString()
        Request
        .delete(COMMON_API)
        .query({
          _id: `${Math.floor(( +id[0] + 1 ) % 10)}${id.slice(1)}`,
          room: systemRoomId.toString()
        })
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(404)
        .expect('Content-Type', /json/)
        .end(function(err) {
          if(err) return done(err)
          done()
        })
      })

      it(`delete the member fail because the id is not valid`, function(done) {
        Request
        .delete(COMMON_API)
        .query({
          _id: memberId.toString().slice(1),
          room: systemRoomId.toString()
        })
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

      it(`delete the member fail because lack of the params of id`, function(done) {
        Request
        .delete(COMMON_API)
        .query({
          room: systemRoomId.toString()
        })
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

      it(`delete the member fail because the room id is not valid`, function(done) {
        Request
        .delete(COMMON_API)
        .query({
          _id: memberId.toString(),
          room: systemRoomId.toString().slice(1)
        })
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

      it(`delete the member fail because lack of the params of room id`, function(done) {
        Request
        .delete(COMMON_API)
        .query({
          _id: memberId.toString()
        })
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

      it(`delete the member fail because then room type is not system`, function(done) {
        Request
        .delete(COMMON_API)
        .query({
          is_delete: 1,
          room: roomId.toString()
        })
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(404)
        .expect('Content-Type', /json/)
        .end(function(err) {
          if(err) return done(err)
          done()
        })
      })

    })

  })

})