require('module-alias/register')
const { UserModel, RoomModel, MessageModel, MemberModel, ImageModel, ROOM_TYPE, MESSAGE_MEDIA_TYPE } = require('@src/utils')
const { expect } = require('chai')
const { Types: { ObjectId } } = require('mongoose')
const { Request, commonValidate, mockCreateUser, mockCreateMember, mockCreateMessage, mockCreateImage, mockCreateRoom } = require('@test/utils')

const COMMON_API = '/api/chat/message'

function responseExpect(res, validate=[]) {
  const { res: { data: target } } = res
  expect(target).to.be.a('array')
  target.forEach(item => {
    expect(item).to.be.a('object').and.that.include.any.keys('type', '_id', 'create_user', 'info', 'message_info', 'createdAt', 'updatedAt', 'un_read_message_count')
    commonValidate.string(item.type)
    commonValidate.objectId(item._id)
    expect(item.create_user).to.be.a('object').and.that.include.any.keys('username', '_id', 'avatar', 'member')
    commonValidate.string(item.create_user.username)
    commonValidate.objectId(item.create_user._id)
    commonValidate.objectId(item.create_user.member)
    if(item.create_user.avatar) {
      commonValidate.poster(item.create_user.avatar)
    }
    expect(item.info).to.be.a('object').and.that.include.any.keys('name', 'avatar', 'description')
    commonValidate.string(item.info.name)
    commonValidate.string(item.info.description)
    if(item.info.avatar) {
      commonValidate.poster(item.info.avatar)
    }
    console.log(item.message_info, 22222)
    expect(item.message_info).to.be.a('object').and.that.includes.any.keys('text', 'image', 'video', 'audio', 'poster')
    if(item.message_info.text) {
      commonValidate.string(item.message_info.text)
    }
    if(item.message_info.video) {
      commonValidate.string(item.message_info.video)
    }
    if(item.message_info.audio) {
      commonValidate.string(item.message_info.audio)
    }
    if(item.message_info.image) {
      commonValidate.string(item.message_info.image)
    }
    if(item.message_info.poster) {
      commonValidate.string(item.message_info.poster)
    }
    commonValidate.number(item.un_read_message_count)
    commonValidate.time(item.createdAt)
    commonValidate.time(item.updatedAt)
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
  let messageId 
  let systemMessageId 
  let imageMessageId 
  let roomId 
  let systemRoomId 
  let memberId 
  let imageId 

  before(function(done) {

    const { model: user, signToken } = mockCreateUser({
      username: COMMON_API
    })
    const { model: image } = mockCreateImage({
      src: COMMON_API
    })

    Promise.all([
      user.save(),
      image.save(),
    ])
    .then(([user, image]) => {
      userInfo = user 
      selfToken = signToken(userInfo._id)
      imageId = image._id
      const { model: memberModel } = mockCreateMember({
        sid: COMMON_API,
        user: userInfo._id 
      })
      return memberModel.save()
    })
    .then(member => {
      memberId = member._id 
      const { model: systemMessage } = mockCreateMessage({
        content: {
          text: COMMON_API,
        },
        readed: [memberId]
      })
      const { model: message } = mockCreateMessage({
        content: {
          text: COMMON_API,
        },
        readed: [memberId]
      })
      const { model: mediaMessage } = mockCreateMessage({
        content: {
          text: COMMON_API,
          image: imageId
        },
        readed: [memberId],
        media_type: MESSAGE_MEDIA_TYPE.IMAGE ,
      })
      const { model: systemRoom } = mockCreateRoom({
        info: {
          name: COMMON_API,
          avatar: imageId,
          description: '测试系统房间'
        },
        origin: true,
        type: ROOM_TYPE.SYSTEM,
      })
      const { model: userRoom } = mockCreateRoom({
        info: {
          name: COMMON_API,
          avatar: imageId,
          description: '测试用户房间'
        },
        origin: false,
        type: ROOM_TYPE.CHAT
      })
      return Promise.all([
        message.save(),
        systemMessage.save(),
        mediaMessage.save(),
        systemRoom.save(),
        userRoom.save()
      ])
    })
    .then(([message, systemMessage, mediaMessage, system, user]) => {
      messageId = message._id 
      systemMessageId = systemMessage._id
      imageMessageId = mediaMessage._id 
      systemRoomId = system._id 
      roomId = user._id 
      return Promise.all([
        RoomModel.updateOne({
          _id: systemRoomId
        }, {
          $set: {
            members: [memberId],
            create_user: memberId,
            message: [systemMessageId]
          }
        }),
        RoomModel.updateOne({
          _id: roomId
        }, {
          $set: {
            members: [memberId],
            create_user: memberId,
            message: [messageId, imageMessageId]
          }
        }),
        MessageModel.updateOne({
          _id: messageId,
        }, {
          $set: {
            room: roomId,
            user_info: memberId,
          }
        }),
        MessageModel.updateOne({
          _id: systemMessageId,
        }, {
          $set: {
            room: systemRoomId,
            user_info: memberId,
          }
        }),
        MessageModel.updateOne({
          _id: imageMessageId,
        }, {
          $set: {
            room: roomId,
            user_info: memberId,
          }
        }),
        MemberModel.updateOne({
          _id: memberId
        }, {
          $set: {
            room: [systemRoomId, roomId]
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
      MessageModel.deleteMany({
        "content.text": COMMON_API
      }),
      UserModel.deleteMany({
        username: COMMON_API
      }),
      MemberModel.deleteMany({
        sid: COMMON_API
      }),
      RoomModel.deleteMany({
        "info.name": COMMON_API
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
            expect(target.length).to.not.be.equals(0)
          })
          done()
        })

      })

      it(`get message list success with type`, function(done) {

        Request
        .get(COMMON_API)
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .query({
          type: ROOM_TYPE.SYSTEM
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          if(err) return done(err)
          const { res: { text } } = res
          let obj
          try{
            obj = JSON.parse(text)
          }catch(_) {
            console.log(_)
            done(err)
          }
          responseExpect(obj, target => {
            expect(target.length).to.not.be.equals(0)
            expect(target.some(item => item._id == systemRoomId)).to.be.true 
            expect(target.some(item => item._id == roomId)).to.be.false
          })
          done()
        })

      })  

      it(`get message list success and not login`, function(done) {

        Request
        .get(COMMON_API)
        .set({
          Accept: 'Application/json',
        })
        .query({
          type: ROOM_TYPE.CHAT
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          if(err) return done(err)
          const { res: { text } } = res
          let obj
          try{
            obj = JSON.parse(text)
          }catch(_) {
            console.log(_)
            done(err)
          }
          responseExpect(obj, target => {
            expect(target.length).to.not.be.equals(0)
            expect(target.some(item => item._id == systemRoomId)).to.be.true 
            expect(target.some(item => item._id == roomId)).to.be.false
          })
          done()
        })

      })  

    })

  })

  describe(`${COMMON_API} post message test`, function() {
      
    describe(`${COMMON_API} post message success test`, function() {
      
      it(`post message success`, function(done) {
        Request
        .post(COMMON_API)
        .send({
          content: COMMON_API,
          type: MESSAGE_MEDIA_TYPE.TEXT,
          _id: roomId.toString()
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

      it(`post message success and post media`, function(done) {
        Request
        .post(COMMON_API)
        .send({
          content: imageId,
          type: MESSAGE_MEDIA_TYPE.IMAGE,
          _id: roomId.toString()
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

      it(`post message success and point_to user`, function(done) {
        Request
        .post(COMMON_API)
        .send({
          content: COMMON_API,
          type: MESSAGE_MEDIA_TYPE.TEXT,
          _id: roomId.toString(),
          point_to: '5edb3c7b4f88da14ca419e61'
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

    describe(`${COMMON_API} post message fail test`, function() {

      it(`post the message fail because not login`, function(done) {
        Request
        .post(COMMON_API)
        .send({
          content: COMMON_API,
          type: MESSAGE_MEDIA_TYPE.TEXT,
          _id: roomId.toString()
        })
        .set({
          Accept: 'Application/json',
        })
        .expect(401)
        .expect('Content-Type', /json/)
        .end(function(err) {
          if(err) return done(err)
          done()
        })
      })

      it(`post the message fail because lack of the params _id`, function(done) {
        Request
        .post(COMMON_API)
        .send({
          content: COMMON_API,
          type: MESSAGE_MEDIA_TYPE.TEXT,
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
          type: MESSAGE_MEDIA_TYPE.TEXT,
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

      it(`post the message fail because the params of media content is not valid`, function(done) {
        Request
        .post(COMMON_API)
        .send({
          content: COMMON_API,
          type: MESSAGE_MEDIA_TYPE.IMAGE,
          _id: roomId.toString()
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
          type: MESSAGE_MEDIA_TYPE.TEXT,
          _id: roomId.toString()
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

      it(`post the message fail because the params of type is not valid`, function(done) {
        Request
        .post(COMMON_API)
        .send({
          content: COMMON_API,
          type: '',
          _id: roomId.toString()
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

      it(`post the message fail because lack of the params of type`, function(done) {
        Request
        .post(COMMON_API)
        .send({
          content: COMMON_API,
          _id: roomId.toString()
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

      it(`post the message fail because the member is not exists`, function(done) {

        MemberModel.updateOne({
          _id: memberId
        }, {
          $set: {
            user: ObjectId("8f63270f005f1c1a0d9448ca")
          }
        })
        .then(_ => {
          return Request
          .post(COMMON_API)
          .send({
            content: COMMON_API,
            type: MESSAGE_MEDIA_TYPE.TEXT,
            _id: roomId.toString()
          })
          .set({
            Accept: 'Application/json',
            Authorization: `Basic ${selfToken}`
          })
          .expect(404)
          .expect('Content-Type', /json/)
        })
        .then(_ => {
          return MemberModel.updateOne({
            _id: memberId
          }, {
            $set: {
              user: userInfo._id
            }
          })
        })
        .then(_ => {
          done()
        })
        .catch(function(err) {
          done(err)
        })

      })

      it(`post the message fail because the member is not int the room`, function(done) {

        Promise.all([
          RoomModel.updateOne({
            _id: roomId
          }, {
            $set: {
              members: []
            }
          }),
          MemberModel.updateOne({
            _id: memberId
          }, {
            $pull: {
              room: roomId
            }
          })
        ])
        .then(_ => {
          return Request
          .post(COMMON_API)
          .send({
            content: COMMON_API,
            type: MESSAGE_MEDIA_TYPE.TEXT,
            _id: roomId.toString()
          })
          .set({
            Accept: 'Application/json',
            Authorization: `Basic ${selfToken}`
          })
          .expect(404)
          .expect('Content-Type', /json/)
        })
        .then(function() {
          return Promise.all([
            RoomModel.updateOne({
              _id: roomId
            }, {
              $set: {
                members: [memberId]
              }
            }),
            MemberModel.updateOne({
              _id: memberId
            }, {
              $push: {
                room: roomId
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

      it(`post the message fail because the room is deleted`, function(done) {

        Promise.all([
          RoomModel.updateOne({
            _id: roomId
          }, {
            $set: {
              deleted: true 
            }
          })
        ])
        .then(_ => {
          return Request
          .post(COMMON_API)
          .send({
            content: COMMON_API,
            type: MESSAGE_MEDIA_TYPE.TEXT,
            _id: roomId.toString()
          })
          .set({
            Accept: 'Application/json',
            Authorization: `Basic ${selfToken}`
          })
          .expect(403)
          .expect('Content-Type', /json/)
        })
        .then(function() {
          return Promise.all([
            RoomModel.updateOne({
              _id: roomId
            }, {
              $set: {
                deleted: false 
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

    })

  })

  describe(`${COMMON_API} put message test`, function() {
      
    describe(`${COMMON_API} put message success test`, function() {

      const _id_ = ObjectId('5edb3c7b4f88da14ca419e61')
      let messageIdA 
      let messageIdB

      after(function(done) {
        MessageModel.find({
          _id: {
            $in: [messageIdA, messageIdB]
          },
          readed: {
            $in: [memberId]
          }
        })
        .select({
          _id: 1,
        })
        .exec()
        .then(data => {
          expect(!!data && data.length >= 2).to.be.true
          done()
        })
        .catch(err => {
          done(err)
        })
      })
      
      it(`put the message success and dependence room id`, function(done) {

        const { model } = mockCreateMessage({
          content: {
            text: COMMON_API,
            audio: _id_
          },
          readed: []
        })
        model.save()
        .then(data => {
          messageIdA = data._id 
          return Promise.all([
            MessageModel.updateOne({
              _id: messageIdA
            }, {
              room: roomId
            }),
            RoomModel.updateOne({
              _id: roomId
            }, {
              $push: {
                message: messageIdA
              }
            })
          ])
        })
        .then(_ => {
          return Request
          .put(COMMON_API)
          .send({
            _id: roomId.toString(),
            type: 1
          })
          .set({
            Accept: 'Application/json',
            Authorization: `Basic ${selfToken}`
          })
          .expect(200)
          .expect('Content-Type', /json/)
        })
        .then(function() {
          done()
        })
        .catch(err => {
          done(err)
        })
      })

      it(`put the message success and dependence message id`, function(done) {
        const { model } = mockCreateMessage({
          content: {
            text: COMMON_API,
            audio: _id_
          },
          readed: []
        })
        model.save()
        .then(data => {
          messageIdB = data._id 
          return Promise.all([
            MessageModel.updateOne({
              _id: messageIdB
            }, {
              room: roomId
            }),
            RoomModel.updateOne({
              _id: roomId
            }, {
              $push: {
                message: messageIdB
              }
            })
          ])
        })
        .then(_ => {
          return Request
          .put(COMMON_API)
          .send({
            _id: messageIdB.toString(),
          })
          .set({
            Accept: 'Application/json',
            Authorization: `Basic ${selfToken}`
          })
          .expect(200)
          .expect('Content-Type', /json/)
        })
        .then(function() {
          done()
        })
        .catch(err => {
          done(err)
        })
      })

    })

    describe(`${COMMON_API} put message fail test`, function() {

      it(`put the message fail because the id is not valid`, function(done) {
        Request
        .put(COMMON_API)
        .send({
          _id: messageId.toString().slice(1),
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

      it(`put the message fail because lack of the id`, function(done) {
        Request
        .put(COMMON_API)
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

  describe(`${COMMON_API} delete message test`, function() {
      
    describe(`${COMMON_API} delete message success test`, function() {

      let messageId1
      let messageId2 
      beforeEach(function(done) {
        const { model: model1 } = mockCreateMessage({
          content: {
            text: COMMON_API
          },
          room: roomId
        })
        const { model: model2 } = mockCreateMessage({
          content: {
            text: COMMON_API
          },
          room: roomId
        })
        Promise.all([
          model1.save(),
          model2.save()
        ])
        .then(([message1, message2]) => {
          messageId1 = message1._id 
          messageId2 = message2._id
          return RoomModel.updateOne({
            _id: roomId
          }, {
            $set: {
              message: [messageId1, messageId2]
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

      afterEach(function(done) {
        MessageModel.find({
          _id: { $in: [ messageId1, messageId2 ] },
          deleted: {
            $in: [memberId]
          }
        })
        .select({
          _id: 1,
          deleted: 1
        })
        .exec()
        .then(data => {
          expect(data.length >= 2).to.be.true
          done()
        })
        .catch(err => {
          console.log('oops: ', err)
          done(err)
        })
      })

      after(function(done) {
        RoomModel.updateOne({
          _id: roomId
        }, {
          $set: {
            message: [messageId]
          }
        })
        .then(_ => {
          done()
        })
        .catch(err => {
          done(err)
        })
      })
      
      it(`delete the message success and dependence room id`, function(done) {
        Request
        .delete(COMMON_API)
        .query({
          _id: roomId.toString(),
          type: 1
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

      it(`delete the message success and dependence message id`, function(done) {
        Request
        .delete(COMMON_API)
        .query({
          _id: `${messageId1.toString()}, ${messageId2.toString()}`
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

    describe(`${COMMON_API} delete message fail test`, function() {

      let messageId1
      before(function(done) {
        const { model } = mockCreateMessage({
          content: {
            text: COMMON_API
          }
        })
        model.save()
        .then(data => {
          messageId1 = data._id 
          return RoomModel.updateOne({
            _id: roomId
          }, {
            $set: {
              message: [messageId1]
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

      after(function(done) {
        RoomModel.updateOne({
          _id: roomId
        }, {
          $set: {
            message: [messageId]
          }
        })
        .then(_ => {
          done()
        })
        .catch(err => {
          done(err)
        })
      })

      // it(`delete the message fail because the id is not valid`, function(done) {
      //   const id = messageId1.toString()
      //   const messageId = `${Math.floor(( +id[0] + 1 ) % 10)}${id.slice(1)}`
      //   Request
      //   .delete(COMMON_API)
      //   .query({
      //     _id: messageId
      //   })
      //   .set({
      //     Accept: 'Application/json',
      //     Authorization: `Basic ${selfToken}`
      //   })
      //   .expect(404)
      //   .expect('Content-Type', /json/)
      //   .end(function(err) {
      //     if(err) return done(err)
      //     done()
      //   })
      // })

      it(`delete the message fail because lack of the id`, function(done) {
        Request
        .delete(COMMON_API)
        .query({
          _id: messageId1.toString().slice(1)
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

})