require('module-alias/register')
const { expect } = require('chai')
const { mockCreateUser, Request, commonValidate, mockCreateFriends } = require('@test/utils')
const { UserModel, FRIEND_STATUS, FriendsModel } = require('@src/utils')

const COMMON_API = '/api/customer/manage/friends'

function responseExpect(res, validate=[]) {

  const { res: { data: target } } = res

  expect(target).to.be.a('object').and.that.includes.all.keys('friends')
  target.friends.forEach(item => {
    expect(item).to.be.a('object').and.that.includes.any.keys('avatar', 'username', '_id', 'description', 'createdAt', 'friend_id', 'member')
    if(item.avatar) {
      commonValidate.poster(item.avatar)
    }
    commonValidate.string(item.username)
    commonValidate.string(item.description)
    commonValidate.objectId(item._id)
    commonValidate.objectId(item.member)
    commonValidate.objectId(item.friend_id)
    commonValidate.date(item.createdAt)
  })

  if(Array.isArray(validate)) {
    validate.forEach(valid => {
      typeof valid == 'function' && valid(target)
    })
  }else if(typeof validate == 'function') {
    validate(target)
  }
}

describe(`${COMMON_API} test`, function() {

  let result
  let selfToken
  let userId
  let friendId 
  let agreeFriendId 
  let selfFriendId
  let agreeUserId 

  before(async function() {

    const { model:user } = mockCreateUser({
      username: COMMON_API,
    })

    const { model: agreeUser } = mockCreateUser({
      username: COMMON_API,
      description: COMMON_API.repeat(2)
    })
  
    const { model: self, signToken } = mockCreateUser({
      username: COMMON_API,
      description: COMMON_API
    })

    await Promise.all([
      self.save(),
      user.save(),
      agreeUser.save()
    ])
    .then(([self, user, agreeUser]) => {
      userId = user._id
      result = self
      agreeUserId = agreeUser._id
      selfToken = signToken(self._id)
      const { model } = mockCreateFriends({
        user: userId
      })
      return Promise.all([
        UserModel.updateOne({
          username: COMMON_API,
          description: COMMON_API
        }, {
          $inc: {
            friends: 1
          }
        }),
        model.save()
      ])
    })
    .then(([, data]) => {
      friendId = data._id
      const { model } = mockCreateFriends({
        user: result._id,
        friends: [
          {
            timestamps: Date.now(),
            _id: friendId,
            status: FRIEND_STATUS.NORMAL
          },
        ]
      })
      const { model: agreeFriend } = mockCreateFriends({
        user: agreeUserId,
      })
      return Promise.all([
        model.save(),
        agreeFriend.save()
      ])
    })
    .then(([data, agreeFriend]) => {
      selfFriendId = data._id 
      agreeFriendId = agreeFriend._id 
      return Promise.all([
        FriendsModel.updateOne({
          _id: friendId
        }, {
          $push: {
            friends: {
              timestamps: Date.now(),
              _id: selfFriendId,
              status: FRIEND_STATUS.NORMAL
            }
          }
        }),
        FriendsModel.updateOne({
          _id: selfFriendId
        }, {
          $set: {
            friends: [
              {
                timestamps: Date.now() - 100,
                _id: agreeFriendId,
                status: FRIEND_STATUS.AGREE
              },
              {
                timestamps: Date.now() - 100,
                _id: friendId,
                status: FRIEND_STATUS.NORMAL
              },
            ]
          }
        }),
        UserModel.updateOne({
          _id: result._id 
        }, {
          $set: {
            friend_id: selfFriendId
          }
        }),
        UserModel.updateOne({
          _id: userId
        }, {
          $set: {
            friend_id: friendId
          }
        }),
        UserModel.updateOne({
          _id: agreeUserId
        }, {
          $set: {
            friend_id: agreeFriendId
          }
        }),
      ])
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
      FriendsModel.deleteMany({
        _id: {
          $in: [friendId, selfFriendId, agreeFriendId]
        }
      })
    ])
    .catch(err => {
      console.log('oops: ', err)
    })

    return Promise.resolve()

  })

  describe(`pre check the params test -> ${COMMON_API}`, function() {

    describe(`pre check params fail test -> ${COMMON_API}`, function() {

      it(`pre check params fail because of the user id is not verify`, function(done) {

        Request
        .post(COMMON_API)
        .send({
          _id: userId.toString().slice(1)
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

      it(`pre check params fail because lack of the user id`, function(done) {

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

  describe(`get self friends list -> ${COMMON_API}`, function() {

    describe(`get self friends list success test -> ${COMMON_API}`, function() {
      
      it(`get self friends list success`, function(done) {

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
          }
          responseExpect(obj, target => {
            const { agree, normal } = target.friends.reduce((acc, cur) => {
              const { friend_id } = cur 
              if(agreeFriendId.equals(friend_id)) acc.agree = true 
              if(friendId.equals(friend_id)) acc.normal = true 
              return acc 
            }, {
              agree: false,
              normal: false
            })
            expect(target.friends.length).not.be.equal(0)
            expect(!!agree && !!normal).to.be.true 
          })
          done()
        })

      })

    })

  })

  describe(`post the new user for friends -> ${COMMON_API}`, function() {

    describe(`post the new user for friends success test -> ${COMMON_API}`, function() {

      before(function(done) {
        FriendsModel.updateMany({
          _id: {
            $in: [
              selfFriendId,
              friendId
            ]
          }
        }, {
          $set: {
            friends: []
          }
        })
        .then(function() {
          done()
        })
        .catch(err => {
          console.log('oops: ', err)
        })
      })

      after(function(done) {
        FriendsModel.findOne({
          _id: selfFriendId,
          $and: [
            {
              "friends._id": { $in: [ friendId ] }
            },
            {
              "friends.status": FRIEND_STATUS.TO_AGREEING
            }
          ]
        })
        .select({
          _id: 0,
          friends: 1
        })
        .exec()
        .then((user) => {
          expect(!!user).to.be.true 
          return FriendsModel.findOne({
            _id: friendId,
            friends: {
              $elemMatch: {
                $and: [
                  {
                    _id: { $in: [ selfFriendId ] }
                  },
                  {
                    status: FRIEND_STATUS.TO_AGREE
                  }
                ]
              }
            }
          })
          .select({
            _id: 0,
            friends: 1
          })
          .exec()
        })
        .then(result => {
          expect(!!result).to.be.true 
        })
        .then(_ => {
          done()
        })
        .catch(err => {
          done(err)
        })
      })

      it(`post the new user for friends success`, function(done) {

        Request
        .post(COMMON_API)
        .send({
          _id: friendId.toString()
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

    describe(`post the new user for friends success but not write success test -> ${COMMON_API}`, function() {

      it(`post the new user for friends fail but the user is friendsed`, function(done) {
        FriendsModel.updateMany({
          _id: selfFriendId
        }, {
          $set: {
            friends: [ { _id: friendId, timestamps: Date.now(), status: FRIEND_STATUS.NORMAL } ]
          }
        })
        .then(function() {
          return Request
          .post(COMMON_API)
          .send({
            _id: friendId.toString()
          })
          .set({
            Accept: 'Application/json',
            Authorization: `Basic ${selfToken}`
          })
          .expect(404)
          .expect('Content-Type', /json/)
        })
        .then(_ => {
          return FriendsModel.findOne({
            _id: selfFriendId,
            "friends._id": { $in: [ friendId ] }
          })
          .select({
            _id: 0,
            friends: 1
          })
          .exec()
          .then(user => {
            expect(!!user && user.friends.length == 1).to.be.true 
            done()
          })
        })
        .catch(err => {
          done(err)
        })

      })

      it(`post the user for friends fail because the friends size is limit`, function(done) {
        FriendsModel.updateMany({
          _id: selfFriendId
        }, {
          $set: {
            friends: new Array(9999).fill({ _id: friendId, timestamps: Date.now() })
          }
        })
        .then(function() {
          return Request
          .post(COMMON_API)
          .send({
            _id: friendId.toString()
          })
          .set({
            Accept: 'Application/json',
            Authorization: `Basic ${selfToken}`
          })
          .expect(404)
          .expect('Content-Type', /json/)
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

  describe(`cancel the user friends -> ${COMMON_API}`, function() {

    describe(`cancel the new user for friends success test -> ${COMMON_API}`, function() {

      before(function(done) {
        FriendsModel.updateMany({
          _id: selfFriendId,
        }, {
          $set: {
            friends: [ { _id: friendId, timestamps: Date.now(), status: FRIEND_STATUS.NORMAL } ]
          }
        })
        .then(function() {
          done()
        })
        .catch(err => {
          console.log('oops: ', err)
        })
      })

      after(async function() {
        const res = await FriendsModel.findOne({
          _id: selfFriendId,
          friends: []
        })
        .select({
          _id: 1,
          friends: 1
        })
        .exec()
        .then(user => {
          return !!user
        })
        .catch(err => {
          console.log('oops: ', err)
          return false
        })

        return res ? Promise.resolve() : Promise.reject(COMMON_API)

      })

      it(`cancel the new user for friends success`, function(done) {

        Request
        .delete(COMMON_API)
        .query({
          _id: friendId.toString()
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

    describe(`cancel the new user for friends success but not write database test -> ${COMMON_API}`, function() {

      before(function(done) {
        FriendsModel.updateMany({
          _id: selfFriendId
        }, {
          $set: {
            friends: []
          }
        })
        .then(function() {
          done()
        })
        .catch(err => {
          console.log('oops: ', err)
        })
      })

      after(function(done) {
        FriendsModel.findOne({
          _id: selfFriendId,
          friends: []
        })
        .select({
          _id: 0,
          friends: 1
        })
        .exec()
        .then(user => {
          return !!user
        })
        .then(result => {
          if(result) return done()
          done(new Error(COMMON_API))
        })
      })

      it(`cancel the new user for friends fail because the user is not friendsed`, function(done) {
        
        Request
        .delete(COMMON_API)
        .query({
          _id: friendId.toString()
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

      it(`cancel the user for friends fail because the user status is TO_AGREE`, function(done) {
        FriendsModel.updateMany({
          _id: selfFriendId
        }, {
          friends: [ { _id: friendId, timestamps: Date.now(), status: FRIEND_STATUS.TO_AGREE } ]
        })
        .then(function() {
          return Request
          .delete(COMMON_API)
          .query({
            _id: friendId.toString()
          })
          .set({
            Accept: 'Application/json',
            Authorization: `Basic ${selfToken}`
          })
          .expect(404)
          .expect('Content-Type', /json/)
        })
        .then(_ => {
          return FriendsModel.updateMany({
            _id: selfFriendId
          }, {
            friends: []
          })
        })
        .then(_ => {
          done()
        })
        .catch(err => {
          console.log('oops: ', err)
        })
      })

      it(`cancel the user for friends fail because the user status is DIS_AGREE`, function(done) {
        FriendsModel.updateMany({
          _id: selfFriendId
        }, {
          friends: [ { _id: friendId, timestamps: Date.now(), status: FRIEND_STATUS.DIS_AGREE } ]
        })
        .then(function() {
          return Request
          .delete(COMMON_API)
          .query({
            _id: friendId.toString()
          })
          .set({
            Accept: 'Application/json',
            Authorization: `Basic ${selfToken}`
          })
          .expect(404)
          .expect('Content-Type', /json/)
        })
        .then(_ => {
          return FriendsModel.updateMany({
            _id: selfFriendId
          }, {
            friends: []
          })
        })
        .then(_ => {
          done()
        })
        .catch(err => {
          console.log('oops: ', err)
        })
      })

      it(`cancel the user for friends fail because the user status is TO_AGREEING`, function(done) {
        FriendsModel.updateMany({
          _id: selfFriendId
        }, {
          friends: [ { _id: friendId, timestamps: Date.now(), status: FRIEND_STATUS.TO_AGREEING } ]
        })
        .then(function() {
          return Request
          .delete(COMMON_API)
          .query({
            _id: friendId.toString()
          })
          .set({
            Accept: 'Application/json',
            Authorization: `Basic ${selfToken}`
          })
          .expect(404)
          .expect('Content-Type', /json/)
        })
        .then(_ => {
          return FriendsModel.updateMany({
            _id: selfFriendId
          }, {
            friends: []
          })
        })
        .then(_ => {
          done()
        })
        .catch(err => {
          console.log('oops: ', err)
        })
      })

      it(`cancel the user for friends fail because the user status is TO_AGREEING`, function(done) {
        FriendsModel.updateMany({
          _id: selfFriendId
        }, {
          friends: [ { _id: friendId, timestamps: Date.now(), status: FRIEND_STATUS.DIS_AGREEED } ]
        })
        .then(function() {
          return Request
          .delete(COMMON_API)
          .query({
            _id: friendId.toString()
          })
          .set({
            Accept: 'Application/json',
            Authorization: `Basic ${selfToken}`
          })
          .expect(404)
          .expect('Content-Type', /json/)
        })
        .then(_ => {
          return FriendsModel.updateMany({
            _id: selfFriendId
          }, {
            friends: []
          })
        })
        .then(_ => {
          done()
        })
        .catch(err => {
          console.log('oops: ', err)
        })
      })

    })

  })

})