require('module-alias/register')
const { UserModel, ImageModel, RoomModel, MemberModel, ROOM_TYPE, MessageModel, MESSAGE_MEDIA_TYPE } = require('@src/utils')
const { expect } = require('chai')
const { Types: { ObjectId } } = require('mongoose')
const { Request, commonValidate, mockCreateUser, mockCreateImage, mockCreateRoom, mockCreateMember, mockCreateMessage, envSet, envUnSet } = require('@test/utils')

const COMMON_API = '/api/manage/chat/message'

function responseExpect(res, validate=[]) {
  const { res: { data: target } } = res

  expect(target).to.be.a('object').and.that.include.all.keys('total', 'list', 'room')
  commonValidate.number(target.total)

  expect(target.room).to.be.a('object').and.that.includes.all.keys('_id', 'createdAt', 'updatedAt', 'info', 'type')
  commonValidate.objectId(target.room._id)
  commonValidate.date(target.room.createdAt)
  commonValidate.date(target.room.updatedAt)
  commonValidate.string(target.room.type)
  expect(target.room.info).to.be.a('object').and.that.includes.any.keys('name', 'description', 'avatar')
  commonValidate.string(target.room.info.name)
  commonValidate.string(target.room.info.description)
  if(target.room.info.avatar) {
    commonValidate.string(target.room.info.avatar)
  }

  expect(target.list).to.be.a('array')
  target.list.forEach(item => {
    expect(item).to.be.a('object').and.that.include.all.keys('_id', 'createdAt', 'updatedAt', "status", 'user_info', 'message_type', 'point_to', 'readed_count', 'deleted_count', 'content', 'media_type', 'room')
    commonValidate.objectId(item._id)
    commonValidate.objectId(item.room)
    commonValidate.date(item.createdAt)
    commonValidate.date(item.updatedAt)
    commonValidate.string(item.status)
    expect(item.user_info).to.be.a('object').and.that.include.any.keys('username', 'avatar', '_id', 'member', 'description')
    commonValidate.string(item.user_info.username)
    commonValidate.string(item.user_info.description)
    commonValidate.objectId(item.user_info._id)
    commonValidate.objectId(item.user_info.member)
    if(item.user_info.avatar) {
      commonValidate.string(item.user_info.avatar)
    }
    commonValidate.string(item.message_type)
    commonValidate.objectId(item.point_to)
    commonValidate.number(item.readed_count)
    commonValidate.number(item.deleted_count)
    expect(item.content).to.be.a('object').and.that.includes.any.keys('text', 'image', 'video', 'audio', 'poster')
    if(item.content.text) {
      commonValidate.string(item.content.text)
    }
    if(item.content.video) {
      commonValidate.string(item.content.video)
    }
    if(item.content.poster) {
      commonValidate.string(item.content.poster)
    }
    if(item.content.audio) {
      commonValidate.string(item.content.audio)
    }
    if(item.content.image) {
      commonValidate.string(item.content.image)
    }
    commonValidate.string(item.media_type)
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
  let messageId 
  let mediaMessageId 
  let systemRoomId 
  let memberId 
  let imageId 
  let getToken
  const mockAudioId = ObjectId('8f63270f005f1c1a0d9448ca')

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
      const { model: textMessage } = mockCreateMessage({
        content: {
          audio: mockAudioId,
          text: COMMON_API
        },
        user_info: memberId,
        media_type: MESSAGE_MEDIA_TYPE.TEXT
      })
      const { model: mediaMessage } = mockCreateMessage({
        content: {
          audio: mockAudioId,
          image: imageId
        },
        user_info: memberId,
        media_type: MESSAGE_MEDIA_TYPE.IMAGE
      })
      return Promise.all([
        systemRoom.save(),
        userRoom.save(),
        textMessage.save(),
        mediaMessage.save()
      ])
    })
    .then(([system, user, text, media]) => {
      systemRoomId = system._id 
      roomId = user._id 
      messageId = text._id 
      mediaMessageId = media._id
      return Promise.all([
        MemberModel.updateOne({
          _id: memberId
        }, {
          $set: {
            room: [systemRoomId, roomId]
          }
        }),
        RoomModel.updateOne({
          _id: roomId
        }, {
          $set: {
            message: [mediaMessageId]
          }
        }),
        RoomModel.updateOne({
          _id: systemRoomId
        }, {
          $set: {
            message: [messageId]
          }
        }),
        MessageModel.updateOne({
          _id: mediaMessageId
        }, {
          $set: {
            room: roomId
          }
        }),
        MessageModel.updateOne({
          _id: messageId
        }, {
          $set: {
            room: systemRoomId
          }
        })
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
      MessageModel.deleteMany({
        "content.audio": mockAudioId
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

  describe(`${COMMON_API} get message list test`, function() {
      
    describe(`${COMMON_API} get message list success test`, function() {
      
      it(`get message list success`, function(done) {

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
          })
          done()
        })

      })

    })

    describe(`${COMMON_API} get message list fail test`, function() {

      it(`get message list fail because the id is not found`, function(done) {
        const id = roomId.toString()
        Request
        .get(COMMON_API)
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .query({
          _id: `${Math.floor(10 / (+id[0] + 1))}${id.slice(1)}`,
        })
        .expect(404)
        .expect('Content-Type', /json/)
        .end(function(err) {
          if(err) return done(err)
          done()
        })

      })

      it(`get message list fail because the id is not valid`, function(done) {

        Request
        .get(COMMON_API)
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .query({
          _id: roomId.toString().slice(1)
        })
        .expect(400)
        .expect('Content-Type', /json/)
        .end(function(err) {
          if(err) return done(err)
          done()
        })

      })

      it(`get message list fail because lack of the params of id`, function(done) {

        Request
        .get(COMMON_API)
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

  describe(`${COMMON_API} post message test`, function() {
      
    describe(`${COMMON_API} post message success test`, function() {
      
      it(`post text message success`, function(done) {
        Request
        .post(COMMON_API)
        .send({
          content: COMMON_API,
          media_type: MESSAGE_MEDIA_TYPE.TEXT,
          _id: systemRoomId.toString(),
          point_to: mockAudioId.toString()
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
          return MessageModel.findOne({
            _id: ObjectId(_id),
            media_type: MESSAGE_MEDIA_TYPE.TEXT,
            "content.text": COMMON_API,
            room: systemRoomId,
            point_to: mockAudioId
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

      it(`post media message success`, function(done) {
        Request
        .post(COMMON_API)
        .send({
          content: imageId.toString(),
          media_type: MESSAGE_MEDIA_TYPE.IMAGE,
          _id: systemRoomId.toString(),
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
          return MessageModel.findOne({
            _id: ObjectId(_id),
            media_type: MESSAGE_MEDIA_TYPE.IMAGE,
            "content.image": imageId,
            room: systemRoomId,
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

    describe(`${COMMON_API} post message fail test`, function() {
      
      it(`post the message fail because the user not the auth`, function(done) {

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
            content: COMMON_API,
            media_type: MESSAGE_MEDIA_TYPE.TEXT,
            _id: systemRoomId.toString(),
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

      it(`post the message fail because the params of content is not valid`, function(done) {
        Request
        .post(COMMON_API)
        .send({
          content: '',
          media_type: MESSAGE_MEDIA_TYPE.TEXT,
          _id: systemRoomId.toString(),
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

      it(`post the message fail because lack of the params of content`, function(done) {
        Request
        .post(COMMON_API)
        .send({
          media_type: MESSAGE_MEDIA_TYPE.TEXT,
          _id: systemRoomId.toString(),
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

      it(`post the message fail because the params of media_type is not valid`, function(done) {
        Request
        .post(COMMON_API)
        .send({
          content: COMMON_API,
          media_type: '',
          _id: systemRoomId.toString(),
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

      it(`post the message fail because lack of the params of media_type`, function(done) {
        Request
        .post(COMMON_API)
        .send({
          content: COMMON_API,
          _id: systemRoomId.toString(),
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

      it(`post the message fail because the params of _id is not valid`, function(done) {
        Request
        .post(COMMON_API)
        .send({
          content: COMMON_API,
          media_type: MESSAGE_MEDIA_TYPE.TEXT,
          _id: systemRoomId.toString().slice(1),
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

      it(`post the message fail because lack of the params of _id`, function(done) {
        Request
        .post(COMMON_API)
        .send({
          content: COMMON_API,
          media_type: MESSAGE_MEDIA_TYPE.TEXT,
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
      
      it(`post the message fail because the _id is not found`, function(done) {
        const id = systemRoomId.toString()
        Request
        .post(COMMON_API)
        .send({
          content: COMMON_API,
          media_type: MESSAGE_MEDIA_TYPE.TEXT,
          _id: `${Math.floor(10 / (+id[0] + 1))}${id.slice(1)}`,
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

      it(`post the message fail because the room is not system`, function(done) {
        Request
        .post(COMMON_API)
        .send({
          content: COMMON_API,
          media_type: MESSAGE_MEDIA_TYPE.TEXT,
          _id: roomId.toString(),
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

  describe(`${COMMON_API} delete message test`, function() {
      
    describe(`${COMMON_API} delete message success test`, function() {

      let messageId1
      let messageId2 
      before(function(done) {
        const { model: message1 } = mockCreateMessage({
          content: {
            audio: mockAudioId,
            text: COMMON_API
          },
          media_type: MESSAGE_MEDIA_TYPE.TEXT,
          room: systemRoomId
        })
        const { model: message2 } = mockCreateMessage({
          content: {
            audio: mockAudioId,
            text: COMMON_API
          },
          media_type: MESSAGE_MEDIA_TYPE.TEXT,
          room: systemRoomId
        })
        Promise.all([
          message1.save(),
          message2.save()
        ])
        .then(([message1, message2]) => {
          messageId1 = message1._id 
          messageId2 = message2._id
          return RoomModel.updateOne({
            _id: systemRoomId
          }, {
            $push: {
              message: {
                $each: [
                  messageId1,
                  messageId2
                ]
              }
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

      after(function(done) {
        MessageModel.find({
          _id: { $in: [ messageId1, messageId2 ] }
        })
        .select({
          _id: 1
        })
        .exec()
        .then(data => {
          expect(data.length).to.be.eq(0)
          done()
        })
        .catch(err => {
          console.log('oops: ', err)
          done(err)
        })
      })
      
      it(`delete the message success with message id`, function(done) {
        Request
        .delete(COMMON_API)
        .query({
          _id: `${messageId1.toString()}`
        })
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .then(function() {
          return Promise.all([
            RoomModel.findOne({
              _id: systemRoomId,
              message: {
                $in: [messageId1]
              }
            }),
            MessageModel.findOne({
              _id: messageId1
            })
            .select({
              _id: 1
            })
            .exec()
          ])
        })
        .then(([ room, data ]) => {
          expect(!!room).to.be.false 
          expect(!!data).to.be.false 
          done()
        })
        .catch(err => {
          done(err)
        })
      })

      it(`delete the message success with room id`, function(done) {
        Request
        .delete(COMMON_API)
        .query({
          _id: `${systemRoomId.toString()}`,
          type: 1
        })
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .then(_ => {
          return Promise.all([
            RoomModel.findOne({
              _id: systemRoomId,
              message: []
            }),
            MessageModel.find({
              _id: {
                $in: [
                  messageId2,
                  messageId
                ]
              }
            })
            .select({
              _id: 1
            })
            .exec()
          ])
        })
        .then(([room, data]) => {
          expect(!!room).to.be.true 
          expect(!!data.length).to.be.false 
          done()
        })
        .catch(function(err) {
          done(err)
        })
      })

    })

    describe(`${COMMON_API} delete message fail test`, function() {

      let messageId 
      before(function(done) {
        const { model: message } = mockCreateMessage({
          content: {
            audio: mockAudioId,
            text: COMMON_API
          },
          media_type: MESSAGE_MEDIA_TYPE.TEXT,
          room: systemRoomId
        })
        message.save()
        .then(data => {
          messageId = data._id 
          RoomModel.updateOne({
            _id: systemRoomId
          }, {
            $push: {
              message: messageId
            }
          })
        })
        .then(_ => {
          done()
        })
        .catch(err => {
          console.log('oops: ', err)
          done(err)
        })
      })
      
      it(`delete the message fail because the user not the auth`, function(done) {
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
            _id: messageId.toString()
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

      it(`delete the message fail because the id is not found`, function(done) {
        const id = messageId.toString()
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

      it(`delete the message fail because the id is not valid`, function(done) {
        Request
        .delete(COMMON_API)
        .query({
          _id: messageId.toString().slice(1)
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

      it(`delete the message fail because lack of the params of id`, function(done) {
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

      it(`delete the message fail because post the error type`, function(done) {
        Request
        .delete(COMMON_API)
        .query({
          _id: messageId.toString(),
          type: 1
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

      it(`delete the message fail because then room type is not system`, function(done) {
        Promise.all([
          MessageModel.updateOne({
            _id: messageId
          }, {
            $set: {
              room: systemRoomId
            }
          }),
          RoomModel.updateOne({
            _id: roomId
          }, {
            $push: {
              message: messageId
            }
          })
        ])
        Request
        .delete(COMMON_API)
        .query({
          _id: messageId.toString(),
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