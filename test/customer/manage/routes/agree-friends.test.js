require('module-alias/register')
const { expect } = require('chai')
const { mockCreateUser, Request, commonValidate, mockCreateFriends } = require('@test/utils')
const { UserModel, FRIEND_STATUS, FriendsModel } = require('@src/utils')

const COMMON_API = '/api/customer/manage/friends/agree'

function responseExpect(res, validate=[]) {

  const { res: { data: target } } = res

  expect(target).to.be.a('object').and.that.includes.all.keys('friends')
  target.friends.forEach(item => {
    expect(item).to.be.a('object').and.that.includes.all.keys('avatar', 'username', '_id', 'description')
    commonValidate.poster(item.avatar)
    commonValidate.string(item.username)
    commonValidate.string(item.description)
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

  before(async function() {

    const { model:user } = mockCreateUser({
      username: COMMON_API,
    })
  
    const { model: self, signToken } = mockCreateUser({
      username: COMMON_API,
      description: COMMON_API
    })

    await Promise.all([
      self.save(),
      user.save()
    ])
    .then(([self, user]) => {
      userId = user._id
      result = self
      selfToken = signToken(self._id)
      const { model } = mockCreateFriends({
        user: result._id,
        friends: [
          {
            timestamps: Date.now(),
            _id: userId,
            status: FRIEND_STATUS.TO_AGREE
          }
        ]
      })
      return model.save()
    })
    .then((data) => {
      friendId = data._id
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
        _id: friendId
      })
    ])
    .catch(err => {
      console.log('oops: ', err)
    })

    return Promise.resolve()

  })

  describe(`pre check the params test -> ${COMMON_API}`, function() {

    describe(`pre check params fail test -> ${COMMON_API}`, function() {

      it(`pre check params fail becasue of the user id is not verify`, function(done) {

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

      it(`pre check params fail becasue lack of the user id`, function(done) {

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
          })
          done()
        })

      })

    })

  })

  describe(`post the agree user for friends -> ${COMMON_API}`, function() {

    describe(`post the agree user for friends success test -> ${COMMON_API}`, function() {

      before(function(done) {
        FriendsModel.updateMany({
          _id: friendId
        }, {
          $set: {
            friends: [ { _id: userId, timestamps: Date.now(), status: FRIEND_STATUS.TO_AGREE } ]
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
          $and: [
            {
              "friends._id": { $in: [ userId ] }
            },
            {
              "friends.status": FRIEND_STATUS.NORMAL
            }
          ]
        })
        .select({
          _id: 0,
          friends: 1
        })
        .exec()
        .then((user) => {
          return !!user
        })
        .then(result => {
          if(result) return done()
          done(new Error(COMMON_API))
        })
      })

      it(`post the agree user for friends success`, function(done) {

        Request
        .post(COMMON_API)
        .send({
          _id: userId.toString()
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
            friends: [ { _id: userId, timestamps: Date.now(), status: FRIEND_STATUS.NORMAL } ]
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
          "friends._id": { $in: [ userId ] }
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
          _id: userId.toString()
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
        FriendsModel.updateMany({
          _id: friendId,
        }, {
          $set: {
            friends: [ { _id: userId, timestamps: Date.now(), status: FRIEND_STATUS.TO_AGREE } ]
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
          _id: friendId,
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

      it(`cancel the agree user for friends success`, function(done) {

        Request
        .delete(COMMON_API)
        .query({
          _id: userId.toString()
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
          _id: userId.toString()
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