require('module-alias/register')
const { expect } = require('chai')
const { 
  Request, 
  mockCreateUser,
  commonValidate,
  mockCreateRoom,
  mockCreateMember,
  mockCreateFriends
} = require('@test/utils')
const {
  MemberModel,
  RoomModel, 
  UserModel,
  FriendsModel
} = require('@src/utils')

const COMMON_API = '/api/chat/member'

function responseExpect(res, validate=[]) {
  const { res: { data: target } } = res
  expect(target).to.be.a('array')
  target.forEach(item => {
    expect(item).to.be.a('object').and.that.includes.any.keys('user', 'sid', 'createdAt', 'updatedAt', '_id')
    // commonValidate.string(item.status)
    if(item.sid) {
      commonValidate.string(item.sid)
    }
    commonValidate.objectId(item._id)
    commonValidate.date(item.createdAt)
    commonValidate.date(item.updatedAt)
    expect(item.user).to.be.a('object').and.that.includes.any.keys('username', 'avatar', '_id', 'friend_id')
    commonValidate.string(item.user.username)
    if(item.user.avatar) {
      commonValidate.string(item.user.avatar)
    }
    commonValidate.objectId(item.user._id)
    commonValidate.objectId(item.user.friend_id)
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

  let userId
  let roomId
  let memberId 
  let userToken
  let getToken
  let friendId 

  before(async function() {

    const { model, signToken } = mockCreateUser({
      username: COMMON_API
    })
    const { model: room } = mockCreateRoom({
      info: {
        name: COMMON_API
      }
    })

    getToken = signToken

    await Promise.all([
      model.save(),
      room.save()
    ])
    .then(([user, room]) => {
      userId = user._id
      userToken = getToken(userId)
      roomId = room._id
      const { model } = mockCreateMember({
        user: userId,
        room: [roomId]
      })

      return model.save()
    })
    .then(data => {
      memberId = data._id
      const { model } = mockCreateFriends({
        user: userId,
        member: memberId
      })
      return Promise.all([
        RoomModel.updateOne({
          info: {
            name: COMMON_API
          }
        }, {
          $set: {
            member: [ memberId ]
          }
        }),
        model.save()
      ])
    })
    .then(([, friend]) => {
      friendId = friend._id 
      return UserModel.updateOne({
        _id: userId
      }, {
        $set: {
          friend_id: friendId
        }
      })
    })
    .catch(err => {
      console.log('oops: ', err)
    })

    return Promise.resolve()

  })

  after(async function() {
    await Promise.all([
      UserModel.deleteMany({
        username: COMMON_API
      }),
      MemberModel.deleteMany({
        user: userId
      }),
      RoomModel.deleteMany({
        "info.name": COMMON_API
      }),
      FriendsModel.deleteOne({
        _id: friendId
      })
    ])
    .catch(err => {
      console.log('oops: ', err)
    })

    return Promise.resolve()

  })

  describe(`get member list test -> ${COMMON_API}`, function() {

    describe(`get the member list success test`, function() {

      it(`get the member list success`, function(done) {

        Request
        .get(COMMON_API)
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${userToken}`
        })
        .query({
          _id: roomId.toString(),
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
          }
          responseExpect(obj, target => {
            expect(target.some(item => item._id === memberId.toString())).to.be.true
          })
          done()
        })

      })

      it(`get the member list success and not login`, function(done) {

        Request
        .get(COMMON_API)
        .set({
          Accept: 'Application/json',
        })
        .query({
          _id: roomId.toString(),
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
          }
          responseExpect(obj, target => {
            expect(target.some(item => item._id === memberId.toString())).to.be.false
          })
          done()
        })

      })

    })

    describe(`get the member list fail test`, function() {

      it(`get member list fail because of not have the room id param`, function(done) {

        Request
        .get(COMMON_API)
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${userToken}`
        })
        .expect(400)
        .expect('Content-Type', /json/)
        .end(function(err) {
          if(err) return done(err)
          done()
        })

      })

      it(`get member list fail because of the database can not find the room id`, function(done) {

        const id = roomId.toString()

        Request
        .get(COMMON_API)
        .query({
          _id: `${(parseInt(id.slice(0, 1)) + 5) % 10}${id.slice(1)}`
        })
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${userToken}`
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
          }
          const { res: { data } } = obj
          expect(data).to.be.a('array').and.that.lengthOf(0)
          done()
        })

      })

      it(`get member list fail because of the room id is not verify`, function(done) {

        Request
        .get(COMMON_API)
        .query({
          _id: roomId.toString().slice(1)
        })
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${userToken}`
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