require('module-alias/register')
const { UserModel, RoomModel, MessageModel, MemberModel, ImageModel, MESSAGE_MEDIA_TYPE, ROOM_TYPE, ROOM_USER_NET_STATUS } = require('@src/utils')
const { expect } = require('chai')
const { Types: { ObjectId } } = require('mongoose')
const { Request, commonValidate, mockCreateUser, mockCreateMember, mockCreateMessage, mockCreateImage, mockCreateRoom } = require('@test/utils')

const COMMON_API = '/api/chat/room'
const JOIN_COMMON_API = '/api/chat/room/join'

function responseExpect(res, validate=[]) {
  const { res: { data: target } } = res
  expect(target).to.be.a('array')
  target.forEach(item => {
    expect(item).to.be.a('object').and.that.include.all.keys('type', 'create_user', 'info', 'members', '_id', 'is_delete', 'createdAt', 'updatedAt', 'online_members')
    expect(item.is_delete).to.be.a('boolean')
    commonValidate.string(item.type)
    commonValidate.number(item.members)
    commonValidate.number(item.online_members)
    commonValidate.objectId(item._id)
    commonValidate.date(item.createdAt)
    commonValidate.date(item.updatedAt)
    expect(item.info).to.be.a('object').and.that.includes.any.keys('name', 'avatar', 'description')
    commonValidate.string(item.info.name)
    if(item.info.avatar) {
      commonValidate.string(item.info.avatar)
    }
    commonValidate.string(item.info.description)
    expect(item.create_user).to.be.a('object').and.that.includes.any.keys('username', 'avatar', '_id', 'description', 'member')
    commonValidate.string(item.create_user.username)
    commonValidate.string(item.create_user.description)
    if(item.create_user.avatar) {
      commonValidate.string(item.create_user.avatar)
    }
    commonValidate.objectId(item.create_user._id)
    commonValidate.objectId(item.create_user.member)
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
  let getToken
  let toDeleteRoomList = []

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
      const { model: systemMessage } = mockCreateMessage({
        content: {
          text: COMMON_API,
        }
      })
      const { model: message } = mockCreateMessage({
        content: {
          text: COMMON_API,
        }
      })
      const { model: mediaMessage } = mockCreateMessage({
        content: {
          text: COMMON_API,
          image: imageId
        },
        media_type: MESSAGE_MEDIA_TYPE.IMAGE 
      })
      const { model: systemRoom } = mockCreateRoom({
        info: {
          name: COMMON_API,
        },
        origin: true,
        type: ROOM_TYPE.SYSTEM,
        members: [memberId]
      })
      const { model: userRoom } = mockCreateRoom({
        info: {
          name: COMMON_API,
        },
        origin: false,
        type: ROOM_TYPE.CHAT,
        members: [memberId]
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
            create_user: memberId,
            message: [systemMessageId]
          }
        }),
        RoomModel.updateOne({
          _id: roomId
        }, {
          $set: {
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
        $or: [
          {
            _id: {
              $in: toDeleteRoomList
            }
          },
          {
            "info.name": {
              $in: [COMMON_API, JOIN_COMMON_API]
            }
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
            expect(target.length).to.not.be.equals(0)
          })
          done()
        })

      })

      it(`get room list success with type`, function(done) {

        Request
        .get(COMMON_API)
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
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
            expect(target.some(item => item._id == systemRoomId.toString())).to.be.false
          })
          done()
        })

      })  

      it(`get room list success with _id`, function(done) {

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
            expect(target.length).to.be.equals(1)
            expect(target[0]._id == roomId.toString()).to.be.true 
          })
          done()
        })

      })  

      it(`get room list success with origin`, function(done) {

        Request
        .get(COMMON_API)
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .query({
          origin: 0 
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
            expect(target.some(item => item._id == systemRoomId.toString())).to.be.false
          })
          done()
        })

      })  

      it(`get room list success with create_user`, function(done) {

        Request
        .get(COMMON_API)
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .query({
          create_user: "5edb3c7b4f88da14ca419e61"
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
            expect(target.some(item => item.create_user._id == userInfo._id.toString())).to.be.false 
          })
          done()
        })

      })  

      it(`get room list success with content`, function(done) {

        Request
        .get(COMMON_API)
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .query({
          content: '11'
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
            expect(target.some(item => item.info.name === COMMON_API)).to.be.false
          })
          done()
        })

      })  

      it(`get room list success with members`, function(done) {

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
            expect(target.some(item => item.info.name == COMMON_API)).to.be.true 
          })
          done()
        })

      }) 

      it(`get room list success and not login`, function(done) {

        Request
        .get(COMMON_API)
        .set({
          Accept: 'Application/json',
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
            expect(target.some(item => item._id == roomId.toString())).to.be.false 
          })
          done()
        })

      })  

    })

  })

  describe(`${COMMON_API} post room test`, function() {
      
    describe(`${COMMON_API} post room success test`, function() {
      
      it(`post room success and post group_room`, function(done) {

        const { model: groupRoom } = mockCreateRoom({
          info: {
            name: COMMON_API,
          },
          origin: false,
          type: ROOM_TYPE.GROUP_CHAT,
          members: [memberId]
        })

        groupRoom.save()
        .then(data => {
          return Promise.all([
            data,
            MemberModel.updateOne({
              _id: memberId
            }, {
              $push: {
                room: data._id
              }
            })
          ])
        })
        .then(([data]) => {
          return Request
          .post(COMMON_API)
          .send({
            _id: data._id.toString(),
            // type: ROOM_TYPE.GROUP_CHAT
          })
          .set({
            Accept: 'Application/json',
            Authorization: `Basic ${selfToken}`
          })
          .expect(200)
          .expect('Content-Type', /json/)
        })
        .then(_ => {
          done()
        })
        .catch(function(err) {
          done(err)
        })
      })

      it(`post room success and post group_room and the room not exists`, function(done) {
        Request
        .post(COMMON_API)
        .send({
          members: memberId.toString(),
          type: ROOM_TYPE.GROUP_CHAT
        })
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
          const { res: { data: target } } = obj
          toDeleteRoomList.push(target)
          done()
        })
      })

      it(`post room success and post system room`, function(done) {
        Request
        .post(COMMON_API)
        .send({
          _id: systemRoomId.toString(),
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

      it(`post room success and post system room and the room not exists`, function(done) {
        Request
        .post(COMMON_API)
        .send({
          _id: ObjectId("5edb3c7b4f88da14ca419e61"),
          type: ROOM_TYPE.SYSTEM
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

      it(`post room success and post chat room`, function(done) {
        Request
        .post(COMMON_API)
        .send({
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

      it(`post room success and post chat room and room not exists`, function(done) {
        Request
        .post(COMMON_API)
        .send({
          members: `${memberId.toString()}`,
          type: ROOM_TYPE.CHAT
        })
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
          const { res: { data: target } } = obj
          toDeleteRoomList.push(target)
          done()
        })
      })

      it(`post system room success and user not login`, function(done) {
        Request
        .post(COMMON_API)
        .send({
          _id: systemRoomId.toString(),
          type: ROOM_TYPE.SYSTEM
        })
        .set({
          Accept: 'Application/json',
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err) {
          if(err) return done(err)
          done()
        })
      })

    })

    describe(`${COMMON_API} post room fail test`, function() {

      it(`post the room fail becuase post the unsystem room and not login`, function(done) {
        Request
        .post(COMMON_API)
        .send({
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

      it(`post the room fail becuase lack params _id and members`, function(done) {
        Request
        .post(COMMON_API)
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .send({
          type: ROOM_TYPE.GROUP_CHAT
        })
        .expect(400)
        .expect('Content-Type', /json/)
        .end(function(err) {
          if(err) return done(err)
          done()
        })
      })

      it(`post the room fail becuase post chat room and lack of params _id and members length not equal 1`, function(done) {
        Request
        .post(COMMON_API)
        .send({
          type: ROOM_TYPE.CHAT
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

      it(`post the room fail becuase the room is deleted`, function(done) {
        RoomModel.updateOne({
          _id: roomId.toString()
        }, {
          $set: {
            deleted: true 
          }
        })
        .then(_ => {
          return Request
          .post(COMMON_API)
          .send({
            _id: roomId.toString()
          })
          .set({
            Accept: 'Application/json',
            Authorization: `Basic ${selfToken}`
          })
          .expect(400)
          .expect('Content-Type', /json/)
        })
        .then(_ => {
          return RoomModel.updateOne({
            _id: roomId.toString()
          }, {
            $set: {
              deleted: false  
            }
          })
        })
        .then(function() {
          done()
        })
        .catch(err => {
          done(err)
        })
      })

    })

  })

  describe(`${COMMON_API} put room test`, function() {
      
    describe(`${COMMON_API} put room success test`, function() {

      after(function(done) {
        RoomModel.find({
          _id: {
            $in: [roomId, systemRoomId]
          },
          online_members: {
            $nin: [memberId]
          }
        })
        .select({
          _id: 1
        })
        .exec()
        .then(room => {
          expect(room.length == 2).to.be.true 
          return Promise.all([
            MemberModel.updateOne({
              _id: memberId,
            }, {
              $set: {
                room: [memberId, systemRoomId]
              }
            }),
            RoomModel.updateMany({
              _id: {
                $in: [roomId, systemRoomId]
              },
            }, {
              $push: {
                members: memberId
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
      
      it(`put the room success`, function(done) {
        Request
        .put(COMMON_API)
        .send({
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

      it(`put all room success`, function(done) {
        Request
        .put(COMMON_API)
        .send({
          all: 1
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

      // it(`put the system room success and not login`, function(done) {
      //   Request
      //   .put(COMMON_API)
      //   .send({
      //     _id: systemRoomId.toString()
      //   })
      //   .set({
      //     Accept: 'Application/json',
      //   })
      //   .expect(200)
      //   .expect('Content-Type', /json/)
      //   .end(function(err) {
      //     if(err) return done(err)
      //     done()
      //   })
      // })

    })

    describe(`${COMMON_API} put room fail test`, function() {


      it(`put the room fail because the id is not valid`, function(done) {
        Request
        .put(COMMON_API)
        .send({
          _id: roomId.toString().slice(1),
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

      it(`put the room fail because lack of the id`, function(done) {
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

      // it(`put the room fail because not login`, function(done) {
      //   Request
      //   .put(COMMON_API)
      //   .send({
      //     _id: roomId.toString()
      //   })
      //   .set({
      //     Accept: 'Application/json',
      //   })
      //   .expect(400)
      //   .expect('Content-Type', /json/)
      //   .end(function(err) {
      //     if(err) return done(err)
      //     done()
      //   })
      // })

      it(`put the room fail because user not online`, function(done) {
        MemberModel.updateOne({
          _id: memberId.toString()
        }, {
          $set: {
            status: ROOM_USER_NET_STATUS.OFFLINE
          }
        })
        .then(_ => {
          return Request
          .put(COMMON_API)
          .send({
            _id: roomId.toString().slice(1),
          })
          .set({
            Accept: 'Application/json',
            Authorization: `Basic ${selfToken}`
          })
          .expect(400)
          .expect('Content-Type', /json/)
        })
        .then(_ => {
          return MemberModel.updateOne({
            _id: memberId.toString()
          }, {
            $set: {
              status: ROOM_USER_NET_STATUS.ONLINE
            }
          })
        })
        .then(function() {
          done()
        })
        .catch(err => {
          done(err)
        })
      })

    })

  })

  describe(`${COMMON_API} delete room test`, function() {
      
    describe(`${COMMON_API} delete room success test`, function() {

      it(`delete chat room success`, function(done) {
        let roomId 
        const { model: chatRoom } = mockCreateRoom({
          info: {
            name: COMMON_API,
          },
          origin: false,
          type: ROOM_TYPE.CHAT,
          members: [memberId],
          create_user: memberId
        })
        chatRoom.save()
        .then(data => {
          roomId = data._id 
          return MemberModel.updateOne({
            _id: memberId
          }, {
            $push: {
              room: roomId
            }
          })
        })
        .then(_ => {
          return Request
          .delete(COMMON_API)
          .query({
            _id: `${roomId.toString()}`
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
            MemberModel.findOne({
              _id: memberId,
              room: {
                $nin: [roomId]
              }
            })
            .select({
              _id: 1
            })
            .exec(),
            RoomModel.findOne({
              _id: roomId,
              deleted: true 
            })
            .select({
              _id: 1
            })
            .exec()
          ])
        })
        .then(([member, room]) => {
          expect(!!member && !!room).to.be.true 
          done()
        })
        .catch(function(err) {
          done(err)
        })
      })

      it(`delete group_chat room success`, function(done) {
        let roomId 
        const { model: chatRoom } = mockCreateRoom({
          info: {
            name: COMMON_API,
          },
          origin: false,
          type: ROOM_TYPE.GROUP_CHAT,
          members: [memberId],
          create_user: memberId
        })
        chatRoom.save()
        .then(data => {
          roomId = data._id 
          return MemberModel.updateOne({
            _id: memberId
          }, {
            $push: {
              room: roomId
            }
          })
        })
        .then(_ => {
          return Request
          .delete(COMMON_API)
          .query({
            _id: `${roomId.toString()}`
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
            MemberModel.findOne({
              _id: memberId,
              room: {
                $nin: [roomId]
              }
            })
            .select({
              _id: 1
            })
            .exec(),
            RoomModel.findOne({
              _id: roomId,
              deleted: true 
            })
            .select({
              _id: 1
            })
            .exec()
          ])
        })
        .then(([member, room]) => {
          expect(!!member && !!room).to.be.true 
          done()
        })
        .catch(function(err) {
          done(err)
        })
      })

    })

    describe(`${COMMON_API} delete room fail test`, function() {

      it(`delete room fail because the room type is system`, function(done) {
        let roomId 
        const { model: chatRoom } = mockCreateRoom({
          info: {
            name: COMMON_API,
          },
          origin: true,
          type: ROOM_TYPE.SYSTEM,
          members: [memberId],
          create_user: memberId
        })
        chatRoom.save()
        .then(data => {
          roomId = data._id 
          return MemberModel.updateOne({
            _id: memberId
          }, {
            $push: {
              room: roomId
            }
          })
        })
        .then(_ => {
          return Request
          .delete(COMMON_API)
          .query({
            _id: `${roomId.toString()}`
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
            MemberModel.findOne({
              _id: memberId,
              room: {
                $nin: [roomId]
              }
            })
            .select({
              _id: 1
            })
            .exec(),
            RoomModel.findOne({
              _id: roomId,
              deleted: true 
            })
            .select({
              _id: 1
            })
            .exec()
          ])
        })
        .then(([member, room]) => {
          expect(!!member || !!room).to.be.false 
          done()
        })
        .catch(function(err) {
          done(err)
        })
      })

      it(`delete room fail because the room's create_user is not self`, function(done) {
        let roomId 
        const { model: chatRoom } = mockCreateRoom({
          info: {
            name: COMMON_API,
          },
          origin: false,
          type: ROOM_TYPE.CHAT,
          members: [memberId],
        })
        chatRoom.save()
        .then(data => {
          roomId = data._id 
          return MemberModel.updateOne({
            _id: memberId
          }, {
            $push: {
              room: roomId
            }
          })
        })
        .then(_ => {
          return Request
          .delete(COMMON_API)
          .query({
            _id: `${roomId.toString()}`
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
            MemberModel.findOne({
              _id: memberId,
              room: {
                $nin: [roomId]
              }
            })
            .select({
              _id: 1
            })
            .exec(),
            RoomModel.findOne({
              _id: roomId,
              deleted: true 
            })
            .select({
              _id: 1
            })
            .exec()
          ])
        })
        .then(([member, room]) => {
          expect(!!member || !!room).to.be.false 
          done()
        })
        .catch(function(err) {
          done(err)
        })
      })

      it(`delete room fail because the _id is not valid`, function(done) {
        Request
        .delete(COMMON_API)
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .send({
          _id: roomId.toString().slice(1)
        })
        .expect(400)
        .expect('Content-Type', /json/)
        .end((err) => {
          if(err) return done(err)
          done()
        })
      })

      it(`delete room fail because lack of the params of _id`, function(done) {
        Request
        .delete(COMMON_API)
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(400)
        .expect('Content-Type', /json/)
        .end((err) => {
          if(err) return done(err)
          done()
        })
      })

    })

  })

  describe(`${JOIN_COMMON_API} join the room test`, function() {

    describe(`${JOIN_COMMON_API} join room success test`, function() {

      after(function(done) {
        RoomModel.findOne({
          _id: roomId,
          online_members: {
            $in: [memberId]
          }
        })
        .select({
          _id: 1
        })
        .exec()
        .then((room) => {
          expect(!!room.length).to.be.false 
          return RoomModel.updateMany({
            _id: {
              $in: [roomId]
            },
          }, {
            $push: {
              online_members: memberId
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
      
      it(`join the room success`, function(done) {
        Request
        .post(JOIN_COMMON_API)
        .send({
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

      it(`join the system room success and not login`, function(done) {
        Request
        .post(JOIN_COMMON_API)
        .send({
          _id: systemRoomId.toString()
        })
        .set({
          Accept: 'Application/json',
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err) {
          if(err) return done(err)
          done()
        })
      })

    })

    describe(`${JOIN_COMMON_API} join room fail test`, function() {


      it(`join the room fail because the id is not valid`, function(done) {
        Request
        .post(JOIN_COMMON_API)
        .send({
          _id: roomId.toString().slice(1),
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

      it(`join the room fail because lack of the id`, function(done) {
        Request
        .post(JOIN_COMMON_API)
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

      // it(`join the room fail because not login`, function(done) {
      //   Request
      //   .post(JOIN_COMMON_API)
      //   .send({
      //     _id: roomId.toString()
      //   })
      //   .set({
      //     Accept: 'Application/json',
      //   })
      //   .expect(400)
      //   .expect('Content-Type', /json/)
      //   .end(function(err) {
      //     if(err) return done(err)
      //     done()
      //   })
      // })

      it(`join the room fail because user not online`, function(done) {
        MemberModel.updateOne({
          _id: memberId.toString()
        }, {
          $set: {
            status: ROOM_USER_NET_STATUS.OFFLINE
          }
        })
        .then(_ => {
          return Request
          .post(JOIN_COMMON_API)
          .send({
            _id: roomId.toString().slice(1),
          })
          .set({
            Accept: 'Application/json',
            Authorization: `Basic ${selfToken}`
          })
          .expect(400)
          .expect('Content-Type', /json/)
        })
        .then(_ => {
          return MemberModel.updateOne({
            _id: memberId.toString()
          }, {
            $set: {
              status: ROOM_USER_NET_STATUS.ONLINE
            }
          })
        })
        .then(function() {
          done()
        })
        .catch(err => {
          done(err)
        })
      })

    })

  })

  describe(`${JOIN_COMMON_API} leave the room test`, function() {

    describe(`${JOIN_COMMON_API} leave room success test`, function() {
      
      it(`leave the chat room success`, function(done) {
        let roomId 
        const { model: chatRoom } = mockCreateRoom({
          info: {
            name: COMMON_API,
          },
          origin: false,
          type: ROOM_TYPE.CHAT,
          members: [memberId],
        })
        chatRoom.save()
        .then(data => {
          roomId = data._id 
          return MemberModel.updateOne({
            _id: memberId
          }, {
            $push: {
              room: roomId
            }
          })
        })
        .then(_ => {
          return Request
          .delete(JOIN_COMMON_API)
          .query({
            _id: `${roomId.toString()}`
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
            MemberModel.findOne({
              _id: memberId,
              room: {
                $nin: [roomId]
              }
            })
            .select({
              _id: 1
            })
            .exec(),
            RoomModel.findOne({
              _id: roomId,
              delete_users: {
                $in: [memberId]
              }
            })
            .select({
              _id: 1
            })
            .exec()
          ])
        })
        .then(([member, room]) => {
          expect(!!member && !!room).to.be.true 
          done()
        })
        .catch(function(err) {
          done(err)
        })
      })

      it(`leave the group room success`, function(done) {
        let roomId 
        const { model: chatRoom } = mockCreateRoom({
          info: {
            name: JOIN_COMMON_API,
          },
          origin: false,
          type: ROOM_TYPE.GROUP_CHAT,
          members: [memberId],
          create_user: memberId
        })
        chatRoom.save()
        .then(data => {
          roomId = data._id 
          return MemberModel.updateOne({
            _id: memberId
          }, {
            $push: {
              room: roomId
            }
          })
        })
        .then(_ => {
          return Request
          .delete(JOIN_COMMON_API)
          .query({
            _id: `${roomId.toString()}`
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
            MemberModel.findOne({
              _id: memberId,
              room: {
                $nin: [roomId]
              }
            })
            .select({
              _id: 1
            })
            .exec(),
            RoomModel.findOne({
              _id: roomId,
              delete_users: {
                $in: [memberId]
              }
            })
            .select({
              _id: 1
            })
            .exec()
          ])
        })
        .then(([member, room]) => {
          expect(!!member && !!room).to.be.true 
          done()
        })
        .catch(function(err) {
          done(err)
        })
      })

      it(`leave the chat room and the leave user length equal 2`, function(done) {
        let roomId 
        let newMemberId 
        let otherUserId 
        
        const { model: chatRoom } = mockCreateRoom({
          info: {
            name: COMMON_API,
          },
          origin: false,
          type: ROOM_TYPE.CHAT,
          members: [memberId]
        })
        const { model: user } = mockCreateUser({
          username: COMMON_API
        })

        Promise.all([
          chatRoom.save(),
          user.save()
        ])
        .then(([room, user]) => {
          roomId = room._id 
          otherUserId = user._id 
          const { model: newMember } = mockCreateMember({
            sid: COMMON_API,
            user: otherUserId
          })
          return newMember.save()
        })
        .then(data => {
          newMemberId = data._id 
          return Promise.all([
            MemberModel.updateMany({
              _id: {
                $in: [memberId, newMemberId]
              }
            }, {
              $push: {
                room: roomId
              }
            }),
            RoomModel.updateOne({
              _id: roomId
            }, {
              $set: {
                members: [newMemberId, memberId]
              },
              $push: {
                delete_users: newMemberId
              }
            })
          ])
        })
        .then(_ => {
          return Request
          .delete(JOIN_COMMON_API)
          .query({
            _id: `${roomId.toString()}, ${systemRoomId.toString()}`
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
            MemberModel.findOne({
              _id: memberId,
              room: {
                $nin: [roomId]
              }
            })
            .select({
              _id: 1
            })
            .exec(),
            RoomModel.findOne({
              _id: roomId,
              members: {
                $nin: [memberId]
              }
            })
            .select({
              _id: 1
            })
            .exec()
          ])
        })
        .then(([member, room]) => {
          expect(!!member).to.be.true 
          expect(!!room).to.be.false 
          done()
        })
        .catch(function(err) {
          done(err)
        })
      })

    })

    describe(`${JOIN_COMMON_API} leave room fail test`, function() {

      it(`leave the room fail because the id is not valid`, function(done) {
        Request
        .delete(JOIN_COMMON_API)
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

      it(`leave the room fail because lack of the id`, function(done) {
        Request
        .delete(JOIN_COMMON_API)
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

      it(`leave the room fail because the room type is system`, function(done) {
        Request
        .delete(JOIN_COMMON_API)
        .query({
          _id: systemRoomId.toString()
        })
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(403)
        .expect('Content-Type', /json/)
        .end(function(err) {
          if(err) return done(err)
          done()
        })
      })

      it(`leave the room fail because the room crete user is not self`, function(done) {
        RoomModel.updateOne({
          _id: roomId,
        }, {
          $set: {
            create_user: ObjectId("5edb3c7b4f88da14ca419e61"),
            type: ROOM_TYPE.GROUP_CHAT
          }
        })
        .then(_ => {
          return Request
          .delete(JOIN_COMMON_API)
          .query({
            _id: `${roomId.toString()}`
          })
          .set({
            Accept: 'Application/json',
            Authorization: `Basic ${selfToken}`
          })
          .expect(403)
          .expect('Content-Type', /json/)
        })
        .then(_ => {
          return RoomModel.updateOne({
            _id: roomId
          }, {
            $set: {
              create_user: memberId,
              type: ROOM_TYPE.CHAT
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

      it(`leave the room fail because the room not includes the user`, function(done) {
        const id = roomId.toString()
        RoomModel.updateOne({
          _id: roomId
        }, {
          $pull: {
            members: memberId
          }
        })
        .then(_ => {
          return Request
          .delete(JOIN_COMMON_API)
          .query({
            _id: id
          })
          .set({
            Accept: 'Application/json',
            Authorization: `Basic ${selfToken}`
          })
          .expect(403)
          .expect('Content-Type', /json/)
        })
        .then(_ => {
          return RoomModel.updateOne({
            _id: roomId
          }, {
            $push: {
              members: memberId
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

    })

  })

})