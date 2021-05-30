require('module-alias/register')
const { SpecialModel, UserModel, RoomModel, MessageModel, MemberModel, ImageModel, ROOM_TYPE, MESSAGE_MEDIA_TYPE } = require('@src/utils')
const { expect } = require('chai')
const { Types: { ObjectId } } = require('mongoose')
const { Request, commonValidate, mockCreateUser, mockCreateMember, mockCreateMessage, mockCreateImage, mockCreateRoom } = require('@test/utils')

const COMMON_API = '/api/chat/message'

function responseExpect(res, validate=[]) {
  const { res: { data: target } } = res
  expect(target).to.be.a('array')
  target.forEach(item => {
    expect(item).to.be.a('object').and.that.include.all.keys('_id', 'user_info', 'point_to', 'content', 'createdAt', 'updatedAt', 'media_type')
    commonValidate.objectId(item._id)
    expect(item.user_info).to.be.a('object').and.that.include.any.keys('username', '_id', 'avatar')
    commonValidate.string(item.user_info.username)
    commonValidate.objectId(item.user_info._id)
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
      expect(item.content.video).to.be.a('object').and.that.include.any.keys('src', 'poster')
      commonValidate.string(item.content.video.src)
      commonValidate.string(item.content.video.poster)
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
      userInfo = user._id 
      selfToken = signToken(userInfo)
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
      })
      const { model: userRoom } = mockCreateRoom({
        info: {
          name: COMMON_API,
        },
        origin: false,
        type: ROOM_TYPE.USER
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
      ])
    })
    .then(special => {
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
          type: ROOM_TYPE.USER
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

})