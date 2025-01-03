require('module-alias/register')
const { expect } = require('chai')
const { mockCreateUser, Request, commonValidate, mockCreateFriends } = require('@test/utils')
const { UserModel, FRIEND_STATUS, FriendsModel } = require('@src/utils')

const COMMON_API = '/api/customer/manage/friends/agree'

function responseExpect(res, validate=[]) {

  const { res: { data: target } } = res

  expect(target).to.be.a('object').and.that.includes.all.keys('friends')
  target.friends.forEach(item => {
    expect(item).to.be.a('object').and.that.includes.any.keys('avatar', 'username', '_id', 'description', 'friend_id', 'createdAt', 'status')
    if(item.avatar) {
      commonValidate.poster(item.avatar)
    }
    commonValidate.objectId(item.friend_id)
    commonValidate.string(item.username)
    commonValidate.string(item.description)
    commonValidate.string(item.status)
    commonValidate.objectId(item._id)
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
  let selfFriendId
  let normalFriendId 
  let disagreeUserId 
  let agreeUserId 
  let disagreeFriendId 
  let agreeFriendId 
  let normalUserId 

  before(async function() {

    const { model:user } = mockCreateUser({
      username: COMMON_API,
    })
  
    const { model: self, signToken } = mockCreateUser({
      username: COMMON_API,
      description: COMMON_API
    })

    const { model:agreeUser } = mockCreateUser({
      username: COMMON_API,
    })

    const { model:disagreeUser } = mockCreateUser({
      username: COMMON_API,
    })

    const { model:normalUser } = mockCreateUser({
      username: COMMON_API,
    })

    await Promise.all([
      self.save(),
      user.save(),
      agreeUser.save(),
      disagreeUser.save(),
      normalUser.save()
    ])
    .then(([self, user, agree, disagree, normalUser]) => {
      userId = user._id
      result = self
      agreeUserId = agree._id 
      disagreeUserId = disagree._id 
      normalUserId = normalUser._id 
      const { model } = mockCreateFriends({
        user: result._id,
      })
      const { model: agreeFriend } = mockCreateFriends({
        user: agreeUserId
      })
      const { model: disagreeFriend } = mockCreateFriends({
        user: disagreeUserId
      })
      const { model: normalFriend } = mockCreateFriends({
        user: normalUserId,
      })
      return Promise.all([
        model.save(),
        agreeFriend.save(),
        disagreeFriend.save(),
        normalFriend.save()
      ])
    })
    .then(([data, agreeFriend, disagreeFriend, normalFriend]) => {
      selfFriendId = data._id
      selfToken = signToken(self._id, selfFriendId)
      agreeFriendId = agreeFriend._id
      disagreeFriendId = disagreeFriend._id
      normalFriendId = normalFriend._id 
      const { model } = mockCreateFriends({
        user: userId,
        friends: [
          {
            timestamps: Date.now(),
            _id: selfFriendId,
            status: FRIEND_STATUS.NORMAL
          },
        ]
      })
      return model.save()
    })
    .then(data => {
      friendId = data._id
      return FriendsModel.updateOne({
        _id: selfFriendId
      }, {
        $set: {
          friends:[{
            timestamps: Date.now(),
            _id: disagreeFriendId,
            status: FRIEND_STATUS.DIS_AGREEED
          }, {
            timestamps: Date.now(),
            _id: friendId,
            status: FRIEND_STATUS.DIS_AGREE
          }, {
            timestamps: Date.now(),
            _id: agreeFriendId,
            status: FRIEND_STATUS.AGREE
          }, {
            timestamps: Date.now(),
            _id: normalFriendId,
            status: FRIEND_STATUS.TO_AGREE
          }]
        }
      })
      // return Promise.all([
      //   FriendsModel.updateOne({
      //     _id: selfFriendId
      //   }, {
      //     $set: {
      //       friends:[{
      //         timestamps: Date.now(),
      //         _id: disagreeFriendId,
      //         status: FRIEND_STATUS.DIS_AGREEED
      //       }, {
      //         timestamps: Date.now(),
      //         _id: disagreeFriendId,
      //         status: FRIEND_STATUS.DIS_AGREEED
      //       }]
      //     }
      //   }),
      //   FriendsModel.updateOne({
      //     _id: agreeFriendId
      //   }, {
      //     $set: {
      //       friends:[{
      //         timestamps: 100000,
      //         _id: selfFriendId,
      //         status: FRIEND_STATUS.AGREE
      //       }]
      //     }
      //   }),
      //   FriendsModel.updateOne({
      //     _id: disagreeFriendId
      //   }, {
      //     $set: {
      //       friends:[{
      //         timestamps: 100001,
      //         _id: selfFriendId,
      //         status: FRIEND_STATUS.DIS_AGREE
      //       }]
      //     }
      //   }),
      //   FriendsModel.updateOne({
      //     _id: normalFriendId
      //   }, {
      //     $set: {
      //       friends:[{
      //         timestamps: 100002,
      //         _id: selfFriendId,
      //         status: FRIEND_STATUS.TO_AGREE
      //       }]
      //     }
      //   }),
      // ])
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
          $in: [
            friendId,
            selfFriendId,
            agreeFriendId,
            disagreeFriendId,
            normalFriendId
          ]
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

  describe(`get to_agree friends list -> ${COMMON_API}`, function() {

    describe(`get to_agree friends list success test -> ${COMMON_API}`, function() {
      
      it(`get to_agree friends list success`, function(done) {

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
            expect(target.friends.length).not.be.equal(0)
            const { agree, disagree, to_agree, self_disagree } = target.friends.reduce((acc, cur) => {
              const { friend_id } = cur 
              if(agreeFriendId.equals(friend_id)) acc.agree = true 
              if(friendId.equals(friend_id)) acc.disagree = true 
              if(disagreeFriendId.equals(friend_id)) acc.self_disagree = true 
              if(normalFriendId.equals(friend_id)) acc.to_agree = true 
              return acc 
            }, {
              agree: false,
              disagree: false,
              to_agree: false,
              self_disagree: false 
            })
            expect(!!agree && !!disagree && !!to_agree && !!self_disagree).to.be.true 
          })
          done()
        })

      })

    })

  })

  describe(`post the agree user for friends -> ${COMMON_API}`, function() {

    describe(`post the agree user for friends success test -> ${COMMON_API}`, function() {

      before(function(done) {
        Promise.all([
          FriendsModel.updateMany({
            _id: friendId
          }, {
            $set: {
              friends: [ { _id: selfFriendId, timestamps: Date.now(), status: FRIEND_STATUS.TO_AGREEING } ]
            }
          }),
          FriendsModel.updateMany({
            _id: selfFriendId
          }, {
            $set: {
              friends: [ { _id: friendId, timestamps: Date.now(), status: FRIEND_STATUS.TO_AGREE } ]
            }
          })
        ])
        .then(function() {
          done()
        })
        .catch(err => {
          console.log('oops: ', err)
        })
      })

      after(function(done) {
        Promise.all([
          FriendsModel.findOne({
            _id: friendId,
            friends: {
              $elemMatch: {
                $and: [
                  {
                    "_id": selfFriendId
                  },
                  {
                    "status": FRIEND_STATUS.AGREE
                  }
                ]
              }
            }
          })
          .select({
            _id: 0,
            friends: 1
          })
          .exec(),
          FriendsModel.findOne({
            _id: selfFriendId,
            friends: {
              $elemMatch: {
                $and: [
                  {
                    "_id": friendId
                  },
                  {
                    "status": FRIEND_STATUS.NORMAL
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
        ])
        .then(([user, self]) => {
          expect(!!user && !!self).to.be.true 
          done()
        })
        .catch(err => {
          done(err)
        })
      })

      it(`post the agree user for friends success`, function(done) {

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

    describe(`post the agree user for friends success but not write success test -> ${COMMON_API}`, function() {

      before(function(done) {
        FriendsModel.updateMany({
          _id: friendId
        }, {
          $set: {
            friends: [ { _id: selfFriendId, timestamps: Date.now(), status: FRIEND_STATUS.NORMAL } ]
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
          _id: friendId,
          "friends._id": { $in: [ selfFriendId ] }
        })
        .select({
          _id: 0,
          friends: 1
        })
        .exec()
        .then(user => {
          return !!user && user.friends.length == 1 && user.friends[0].status == FRIEND_STATUS.NORMAL
        })
        .then(result => {
          if(result) return done()
          done(new Error(COMMON_API))
        })
      })

      it(`post the agree user for friends fail but the user is friendsed`, function(done) {

        Request
        .post(COMMON_API)
        .send({
          _id: friendId
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

  describe(`cancel agree the user friends -> ${COMMON_API}`, function() {

    describe(`cancel agree the new user for friends success test -> ${COMMON_API}`, function() {

      before(function(done) {
        Promise.all([
          FriendsModel.updateMany({
            _id: friendId,
          }, {
            $set: {
              friends: [ { _id: selfFriendId, timestamps: Date.now(), status: FRIEND_STATUS.TO_AGREE } ]
            }
          }),
          FriendsModel.updateMany({
            _id: selfFriendId,
          }, {
            $set: {
              friends: [ { _id: friendId, timestamps: Date.now(), status: FRIEND_STATUS.TO_AGREEING } ]
            }
          })
        ])
        .then(function() {
          done()
        })
        .catch(err => {
          console.log('oops: ', err)
        })
      })

      after(async function() {
        const res = await Promise.all([
          FriendsModel.findOne({
            _id: friendId,
            friends: {
              $elemMatch: {
                _id: selfFriendId,
                status: FRIEND_STATUS.DIS_AGREEED
              }
            }
          })
          .select({
            _id: 1,
            friends: 1
          })
          .exec(),
          FriendsModel.findOne({
            _id: selfFriendId,
            friends: {
              $elemMatch: {
                _id: friendId,
                status: FRIEND_STATUS.DIS_AGREE
              }
            }
          })
          .select({
            _id: 1,
            friends: 1
          })
          .exec()
        ])
        .then(([user, self]) => {
          return !!user && !!self
        })
        .catch(err => {
          console.log('oops: ', err)
          return false
        })

        return res ? Promise.resolve() : Promise.reject(COMMON_API)

      })

      it(`cancel the agree user for friends success`, function(done) {

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

    describe(`cancel agree the new user for friends success but not write database test -> ${COMMON_API}`, function() {

      before(function(done) {
        FriendsModel.updateMany({
          _id: friendId
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

      it(`cancel agree the new user for friends fail because the user is not friendsed`, function(done) {
        
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

    })

  })

})