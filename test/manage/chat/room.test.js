require('module-alias/register')
const { UserModel, ImageModel, RoomModel, MemberModel, ROOM_TYPE, MessageModel } = require('@src/utils')
const { expect } = require('chai')
const { Types: { ObjectId } } = require('mongoose')
const { Request, commonValidate, mockCreateUser, mockCreateImage, mockCreateRoom, mockCreateMember, mockCreateMessage, envSet, envUnSet } = require('@test/utils')

const COMMON_API = '/api/manage/chat/room'

function responseExpect(res, validate=[]) {
  const { res: { data: target } } = res

  expect(target).to.be.a('object').and.that.include.all.keys('total', 'list')
  commonValidate.number(target.total)
  expect(target.list).to.be.a('array')
  target.list.forEach(item => {
    expect(item).to.be.a('object').and.that.include.all.keys('_id', 'createdAt', 'updatedAt', 'type', 'origin', 'delete_users', 'message', 'create_user', 'info', 'members', 'online_members', 'is_delete')
    commonValidate.objectId(item._id)
    commonValidate.date(item.createdAt)
    commonValidate.date(item.updatedAt)
    commonValidate.string(item.type)
    expect(item.origin).to.be.a('boolean')
    commonValidate.number(item.delete_users)
    commonValidate.number(item.message)
    expect(item.info).to.be.a('object').and.that.include.any.keys('name', 'avatar', 'description')
    commonValidate.string(item.info.name)
    commonValidate.string(item.info.description)
    if(item.info.avatar) {
      commonValidate.string(item.info.avatar)
    }
    expect(item.create_user).to.be.a('object').and.that.include.any.keys('username', 'avatar', '_id', 'member', 'description')
    commonValidate.string(item.create_user.username)
    commonValidate.string(item.create_user.description)
    commonValidate.objectId(item.create_user._id)
    commonValidate.objectId(item.create_user.member)
    if(item.create_user.avatar) {
      commonValidate.string(item.create_user.avatar)
    }
    commonValidate.number(item.members)
    commonValidate.number(item.online_members)
    expect(item.is_delete).to.be.a('boolean')
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
        userRoom.save()
      ])
    })
    .then(([system, user]) => {
      systemRoomId = system._id 
      roomId = user._id 
      return MemberModel.updateOne({
        _id: memberId
      }, {
        $set: {
          room: [systemRoomId, roomId]
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

  describe(`${COMMON_API} get room list test`, function() {
      
    describe(`${COMMON_API} get room list success test`, function() {
      
      it(`get room list success`, function(done) {

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

      it(`get room list success width _id`, function(done) {

        Request
        .get(COMMON_API)
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .query({
          _id: roomId.toString()
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
            expect(target.list.some(item => roomId.equals(item._id))).to.be.true 
          })
          done()
        })

      })  

      it(`get room list success width type`, function(done) {

        Request
        .get(COMMON_API)
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .query({
          type: ROOM_TYPE.SYSTEM,
          origin: 1,
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
            expect(!!target.list.find(item => systemRoomId.equals(item._id))).to.be.true 
          })
          done()
        })

      })  

      it(`get room list success width origin`, function(done) {

        Request
        .get(COMMON_API)
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .query({
          origin: 1
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
            expect(!!target.list.find(item => systemRoomId.equals(item._id))).to.be.true 
          })
          done()
        })

      })  

      it(`get room list success width create_user`, function(done) {

        Request
        .get(COMMON_API)
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .query({
          create_user: memberId.toString()
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
            return done(_)
          }
          responseExpect(obj, target => {
            expect(target.list.length).to.not.be.equals(0)
            expect(!!target.list.find(item => roomId.equals(item._id))).to.be.true 
          })
          done()
        })

      })  

      it(`get room list success width content`, function(done) {
        Request
        .get(COMMON_API)
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .query({
          content: COMMON_API.slice(1, 5)
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
            expect(!!target.list.find(item => roomId.equals(item._id))).to.be.true 
          })
          done()
        })
      })

      it(`get room list success width members`, function(done) {
        Request
        .get(COMMON_API)
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .query({
          members: memberId.toString()
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
            expect(!!target.list.find(item => systemRoomId.equals(item._id))).to.be.true 
          })
          done()
        })
      })

    })

  })

  describe(`${COMMON_API} post room test`, function() {
      
    describe(`${COMMON_API} post room success test`, function() {
      
      it(`post room success`, function(done) {
        let membersCount = 0
        MemberModel.find({})
        .select({
          _id: 1
        })
        .exec()
        .then(data => {
          membersCount = data.length
          return Request
          .post(COMMON_API)
          .send({
            name: COMMON_API,
            description: COMMON_API,
            avatar: imageId.toString(),
          })
          .set({
            Accept: 'Application/json',
            Authorization: `Basic ${selfToken}`
          })
          .expect(200)
          .expect('Content-Type', /json/)
        })
        .then(res => {
          const { res: { text } } = res
          let obj
          try{
            obj = JSON.parse(text)
          }catch(_) {
            return done(err)
          }
          const { res: { data: { _id } } } = obj
          return RoomModel.findOne({
            _id: ObjectId(_id),
            "info.name": COMMON_API,
            "info.description": COMMON_API,
            members: {
              $size: membersCount
            }
          })
          .select({
            _id: 1,
          })
          .exec()
        })
        .then(data => {
          expect(!!data).to.be.true 
          done()
        })
        .catch(err => {
          done(err)
        })
      })

      it(`post room success and post members`, function(done) {
        Request
        .post(COMMON_API)
        .send({
          name: COMMON_API,
          description: COMMON_API,
          avatar: imageId.toString(),
          members: memberId.toString()
        })
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .then(res => {
          const { res: { text } } = res
          let obj
          try{
            obj = JSON.parse(text)
          }catch(_) {
            return done(err)
          }
          const { res: { data: { _id } } } = obj
          return RoomModel.findOne({
            _id: ObjectId(_id),
            "info.name": COMMON_API,
            "info.description": COMMON_API,
            members: {
              $size: 1
            }
          })
          .select({
            _id: 1,
          })
          .exec()
        })
        .then(data => {
          expect(!!data).to.be.true 
          done()
        })
        .catch(err => {
          done(err)
        })
      })

    })

    describe(`${COMMON_API} post room fail test`, function() {
      
      it(`post the room fail because the user not the auth`, function(done) {

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
            name: COMMON_API,
            description: COMMON_API,
            avatar: imageId.toString(),
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

      it(`post the room fail becuase the params of avatar is not valid`, function(done) {
        Request
        .post(COMMON_API)
        .send({
          name: COMMON_API,
          description: COMMON_API,
          avatar: imageId.toString().slice(1)
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

      it(`post the room fail becuase lack of the params of avatar`, function(done) {
        Request
        .post(COMMON_API)
        .send({
          name: COMMON_API,
          description: COMMON_API,
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

      it(`post the room fail becuase the params of name is not valid`, function(done) {
        Request
        .post(COMMON_API)
        .send({
          name: '',
          description: COMMON_API,
          avatar: imageId.toString(),
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

      it(`post the room fail becuase lack of the params of name`, function(done) {
        Request
        .post(COMMON_API)
        .send({
          description: COMMON_API,
          avatar: imageId.toString(),
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

    })

  })

  describe(`${COMMON_API} put room test`, function() {

    let newName = COMMON_API + 'new-room'
      
    describe(`${COMMON_API} put room success test`, function() {
      
      it(`put the room success`, function(done) {
        let otherMemberId 
        const { model } = mockCreateMember({
          user: ObjectId('8f63270f005f1c1a0d9448ca'),
          sid: COMMON_API
        })
        model.save()
        .then(data => {
          otherMemberId = data._id 
          return RoomModel.updateOne({
            _id: roomId
          }, {
            $push: {
              members: otherMemberId
            }
          })
        })
        .then(_ => {
          return Request
          .put(COMMON_API)
          .send({
            _id: roomId.toString(),
            avatar: '8f63270f005f1c1a0d9448ca',
            name: newName,
            members: memberId.toString(),
            description: newName,
          })
          .set({
            Accept: 'Application/json',
            Authorization: `Basic ${selfToken}`
          })
          .expect(200)
          .expect('Content-Type', /json/)
        })
        .then(function(_) {
          return RoomModel.findOne({
            _id: roomId,
            "info.avatar": ObjectId('8f63270f005f1c1a0d9448ca'),
            "info.name": newName,
            members: {
              $nin: [otherMemberId]
            },
            "info.description": newName,
          })
        })
        .then(data => {
          expect(!!data).to.be.true 
          return RoomModel.updateOne({
            _id: roomId
          }, {
            $set: {
              "info.avatar": imageId,
              "info.description": COMMON_API,
              "info.name": COMMON_API,
              members: [memberId]
            }
          })
        })
        .then(_ => {
          done()
        })
        .catch(err => {
          done(err)
        })
      })

    })

    describe(`${COMMON_API} put room fail test`, function() {
      
      it(`put the room fail because the user not the auth`, function(done) {
        
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
          .put(COMMON_API)
          .send({
            _id: roomId.toString(),
            avatar: '8f63270f005f1c1a0d9448ca',
            name: newName,
            description: newName,
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

      it(`put the room fail because the id is not valid`, function(done) {
        Request
        .put(COMMON_API)
        .send({
          _id: roomId.toString().slice(1),
          avatar: '8f63270f005f1c1a0d9448ca',
          name: newName,
          description: newName,
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

      it(`put the room fail because the id is not found`, function(done) {
        const id = roomId.toString()
        Request
        .put(COMMON_API)
        .send({
          _id: `${Math.floor(10 / (+id[0] + 1))}${id.slice(1)}`,
          avatar: '8f63270f005f1c1a0d9448ca',
          name: newName,
          description: newName,
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

      it(`put the room fail because lack of the params of id`, function(done) {
        Request
        .put(COMMON_API)
        .send({
          avatar: '8f63270f005f1c1a0d9448ca',
          name: newName,
          description: newName,
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

      it(`put the room fail becuase the params of avatar is not valid`, function(done) {
        Request
        .put(COMMON_API)
        .send({
          _id: roomId.toString(),
          avatar: '8f63270f005f1c1a0d9448c',
          name: newName,
          description: newName,
        })
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .then(_ => {
          return RoomModel.findOne({
            _id: roomId.toString(),
          })
          .select({
            _id: 1,
            "info.avatar": 1
          })
          .exec()
        })
        .then(function(data) {
          expect(data.info.avatar.toString() === '8f63270f005f1c1a0d9448c').to.be.false 
          done()
        })
        .catch(err => {
          done(err)
        })
      })

      it(`put the room fail becuase the params of members is not valid`, function(done) {
        Request
        .put(COMMON_API)
        .send({
          _id: roomId.toString(),
          avatar: '8f63270f005f1c1a0d9448ca',
          name: newName,
          description: newName,
          members: ''
        })
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .then(_ => {
          return RoomModel.findOne({
            _id: roomId.toString(),
            members: { 
              $size: 1
            }
          })
          .select({
            _id: 1
          })
          .exec()
        })
        .then(function(data) {
          expect(!!data).to.be.true 
          done()
        })
        .catch(err => {
          done(err)
        })
      })

      it(`put the room fail becuase the params of name is not valid`, function(done) {
        Request
        .put(COMMON_API)
        .send({
          _id: roomId.toString(),
          avatar: '8f63270f005f1c1a0d9448ca',
          name: '',
          description: newName,
        })
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .then(_ => {
          return RoomModel.findOne({
            _id: roomId.toString(),
            "info.name": '',
          })
          .select({
            _id: 1
          })
          .exec()
        })
        .then(function(data) {
          expect(!!data).to.be.false 
          done()
        })
      })

      it(`put the room fail becuase the params of description is not valid`, function(done) {
        Request
        .put(COMMON_API)
        .send({
          _id: roomId.toString(),
          avatar: '8f63270f005f1c1a0d9448ca',
          name: newName,
          description: '',
        })
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .then(_ => {
          return RoomModel.findOne({
            _id: roomId.toString(),
            "info.description": '',
          })
          .select({
            _id: 1
          })
          .exec()
        })
        .then(function(data) {
          expect(!!data).to.be.false 
          done()
        })
      })

    })

  })

  describe(`${COMMON_API} delete room test`, function() {
      
    describe(`${COMMON_API} delete room success test`, function() {

      let roomId1
      let roomId2 
      let messageId1
      let messageId2
      before(function(done) {
        const { model: model1 } = mockCreateRoom({
          info: {
            name: COMMON_API + 'delete-1',
            description: COMMON_API,
          },
          members: [memberId]
        })
        const { model: model2 } = mockCreateRoom({
          info: {
            name: COMMON_API + 'delete-2',
            description: COMMON_API,
          },
          members: [memberId],
        })
        Promise.all([
          model1.save(),
          model2.save()
        ])
        .then(([room1, room2]) => {
          roomId1 = room1._id 
          roomId2 = room2._id
          const { model: message1 } = mockCreateMessage({
            room: roomId1
          })
          const { model: message2 } = mockCreateMessage({
            room: roomId2
          })
          return Promise.all([
            message1.save(),
            message2.save(),
            MemberModel.updateOne({
              _id: memberId
            }, {
              $pushAll: {
                room: [roomId1, roomId2]
              }
            })
          ])
        })
        .then(([message1, message2]) => {
          messageId1 = message1._id 
          messageId2 = message2._id 
          return Promise.all([
            RoomModel.updateOne({
              _id: roomId1
            }, {
              $push: {
                message: messageId1
              }
            }),
            RoomModel.updateOne({
              _id: roomId2
            }, {
              $push: {
                message: messageId2
              }
            })
          ])
        })
        .then(_ => {
          done()
        })
        .catch(err => {
          console.log('oops: ', err)
          done(err)
        })
      })

      after(function(done) {
        let callback = done 
        Promise.all([
          RoomModel.find({
            _id: { $in: [ roomId1, roomId2 ] }
          })
          .select({
            _id: 1
          })
          .exec(),
          MessageModel.find({
            _id: {
              $in: [messageId1, messageId2]
            }
          })
          .select({
            _id: 1
          })
          .exec(),
          MemberModel.findOne({
            _id: memberId,
            room: {
              $in: [
                roomId1,
                roomId2
              ]
            }
          })
          .select({
            _id: 1
          })
          .exec()
        ])
        .then(([room, message, member]) => {
          expect(room.length).to.be.eq(0)
          expect(message.length).to.be.eq(0)
          expect(!!member).to.be.false
        })
        .catch(err => {
          callback = done.bind(this, err)
        })
        .then(_ => {
          return Promise.all([
            MessageModel.deleteMany({
              _id: {
                $in: [messageId1, messageId2]
              }
            }),
          ])
        })
        .then(_ => {
          callback()
        })
        .catch(err => {
          done(err)
        })
      })
      
      it(`delete the room success`, function(done) {
        Request
        .delete(COMMON_API)
        .query({
          _id: `${roomId1.toString()}, ${roomId2.toString()}`
        })
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err) {
          if(err) return done(err)
          done()
        })
      })

    })

    describe(`${COMMON_API} delete room fail test`, function() {

      let roomId 
      before(function(done) {
        const { model: model } = mockCreateRoom({
          info: {
            name: COMMON_API + 'delete-3',
            description: COMMON_API,
          }
        })
        model.save()
        .then(data => {
          roomId = data._id 
          done()
        })
        .catch(err => {
          console.log('oops: ', err)
          done(err)
        })
      })
      
      it(`delete the room fail because the user not the auth`, function(done) {
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
            _id: roomId.toString()
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

      it(`delete the room fail because the id is not found`, function(done) {
        const id = roomId.toString()
        Request
        .delete(COMMON_API)
        .query({
          _id: `${Math.floor(( +id[0] + 1 ) % 10)}${id.slice(1)}`
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

      it(`delete the room fail because the id is not valid`, function(done) {
        Request
        .delete(COMMON_API)
        .query({
          _id: roomId.toString().slice(1)
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

      it(`delete the room fail because lack of the params of id`, function(done) {
        Request
        .delete(COMMON_API)
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