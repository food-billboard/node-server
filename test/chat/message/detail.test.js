require('module-alias/register')
const { UserModel, RoomModel, MessageModel, FriendsModel, MemberModel, VideoModel, ImageModel, ROOM_TYPE, MESSAGE_MEDIA_TYPE } = require('@src/utils')
const { expect } = require('chai')
const { Request, commonValidate, mockCreateUser, mockCreateFriends, mockCreateMember, mockCreateMessage, mockCreateImage, mockCreateRoom, mockCreateVideo } = require('@test/utils')

const COMMON_API = '/api/chat/message/detail'

function responseExpect(res, validate=[]) {
  const { res: { data: target } } = res
  expect(target).to.be.a('object').and.that.includes.all.keys('room', "message")
  expect(target.room).to.be.a('object').and.that.includes.all.keys('_id', 'info')
  commonValidate.objectId(target.room._id)
  expect(target.room.info).to.be.a('object').and.that.includes.any.keys('name', 'description', 'avatar')
  commonValidate.string(target.room.info.name)
  commonValidate.string(target.room.info.description)
  if(target.room.info.avatar) {
    commonValidate.poster(target.room.info.avatar)
  }
  expect(target.message.length > 0).to.be.true 
  target.message.forEach(item => {
    expect(item).to.be.a('object').and.that.include.all.keys('_id', 'user_info', 'point_to', 'content', 'createdAt', 'updatedAt', 'media_type')
    commonValidate.objectId(item._id)
    expect(item.user_info).to.be.a('object').and.that.include.any.keys('username', '_id', 'avatar', 'description', 'friend_id', 'member')
    commonValidate.string(item.user_info.username)
    commonValidate.string(item.user_info.description)
    commonValidate.objectId(item.user_info._id)
    commonValidate.objectId(item.user_info.member)
    commonValidate.objectId(item.user_info.friend_id)
    if(item.user_info.avatar) {
      commonValidate.poster(item.user_info.avatar)
    }
    commonValidate.objectId(item.point_to)
    commonValidate.string(item.media_type)
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
  let videoMessageId 
  let roomId 
  let systemRoomId 
  let memberId 
  let imageId 
  let videoId 
  let friendId 

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
      const { model: videoModel } = mockCreateVideo({
        src: COMMON_API,
        poster: imageId
      })
      return Promise.all([
        memberModel.save(),
        videoModel.save()
      ])
    })
    .then(([member, video]) => {
      memberId = member._id
      videoId = video._id  
      const { model: friend } = mockCreateFriends({
        user: userInfo._id,
        member: memberId
      })
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
      const { model: imageMessage } = mockCreateMessage({
        content: {
          text: COMMON_API,
          image: imageId
        },
        media_type: MESSAGE_MEDIA_TYPE.IMAGE 
      })
      const { model: videoMessage } = mockCreateMessage({
        content: {
          text: COMMON_API,
          video: videoId
        },
        media_type: MESSAGE_MEDIA_TYPE.VIDEO 
      })
      const { model: systemRoom } = mockCreateRoom({
        info: {
          name: COMMON_API,
        },
        origin: true,
        type: ROOM_TYPE.SYSTEM,
        members: [
          memberId
        ]
      })
      const { model: userRoom } = mockCreateRoom({
        info: {
          name: COMMON_API,
          description: '测试用户房间'
        },
        origin: false,
        type: ROOM_TYPE.CHAT,
        members: [
          memberId
        ]
      })
      return Promise.all([
        message.save(),
        systemMessage.save(),
        imageMessage.save(),
        videoMessage.save(),
        systemRoom.save(),
        userRoom.save(),
        friend.save()
      ])
    })
    .then(([message, systemMessage, imageMessage, videoMessage, system, user, friend]) => {
      messageId = message._id 
      systemMessageId = systemMessage._id
      imageMessageId = imageMessage._id 
      videoMessageId = videoMessage._id 
      systemRoomId = system._id 
      roomId = user._id 
      friendId = friend._id 
      return Promise.all([
        MemberModel.updateOne({
          _id: memberId
        }, {
          $set: {
            room: [systemRoomId, roomId]
          }
        }),
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
            message: [messageId, imageMessageId, videoMessageId]
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
        MessageModel.updateOne({
          _id: videoMessageId,
        }, {
          $set: {
            room: roomId,
            user_info: memberId,
          }
        }),
        UserModel.updateOne({
          _id: userInfo._id 
        }, {
          $set: {
            friend_id: friendId
          }
        })
      ])
    })
    .then(() => {
      done()
    })
    .catch(err => {
      console.log('oops: ', err)
      done(err)
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
      }),
      VideoModel.deleteMany({
        src: COMMON_API
      }),
      FriendsModel.deleteMany({
        _id: friendId
      })
    ])
    .then(_ => {
      done()
    })
    .catch(err => {
      console.log('oops: ', err)
      done(err)
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
            expect(target.length).to.not.be.equals(0)
          })
          done()
        })

      })

      it(`get message list success with message id`, function(done) {
        Request
        .get(COMMON_API)
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .query({
          _id: roomId.toString(),
          messageId: messageId.toString()
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
            expect(target.message.some(item => item._id === messageId.toString())).to.be.true
          })
          done()
        })
      })

    })

    describe(`${COMMON_API} get message list fail test`, function() {

      it(`get the message list fail because lack of the params _id`, function(done) {
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

      it(`get the message list fail because the params of _id is not valid`, function(done) {
        Request
        .get(COMMON_API)
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

      it(`get the message list fail because the member not in the room`, function(done) {

        Promise.all([
          MemberModel.updateOne({
            _id: memberId
          }, {
            $pull: {
              room: roomId
            }
          }),
          RoomModel.updateOne({
            _id: roomId
          }, {
            $pull: {
              members: memberId
            }
          })
        ])
        .then(_ => {
          return Request
          .get(COMMON_API)
          .query({
            content: COMMON_API,
            type: MESSAGE_MEDIA_TYPE.TEXT,
          })
          .set({
            Accept: 'Application/json',
            Authorization: `Basic ${selfToken}`
          })
          .expect(400)
          .expect('Content-Type', /json/)
        })
        .then(_ => {
          return Promise.all([
            MemberModel.updateOne({
              _id: memberId
            }, {
              $push: {
                room: roomId
              }
            }),
            RoomModel.updateOne({
              _id: roomId
            }, {
              $push: {
                members: memberId
              }
            })
          ])
        })
        .then(function() {
          done()
        })
        .catch(err => {
          done(err)
        })
      })

      it(`get message list fail because not login`, function(done) {

        Request
        .get(COMMON_API)
        .set({
          Accept: 'Application/json',
        })
        .query({
          _id: roomId.toString()
        })
        .expect(404)
        .expect('Content-Type', /json/)
        .end((err) => {
          if(err) return done(err)
          done()
        })

      })  

    })

  })

})