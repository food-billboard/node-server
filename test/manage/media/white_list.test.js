require('module-alias/register')
const { UserModel, ImageModel, MEDIA_AUTH } = require('@src/utils')
const { Request, mockCreateUser, mockCreateImage } = require('@test/utils')

const COMMON_API = '/api/manage/media/person'

describe(`${COMMON_API} test`, () => {

  let userInfo
  let anotherUserId
  let anotherUser2Id
  let selfToken
  let imageId
  let getToken
  const imageSize = 1024

  before(function(done) {

    const { model } = mockCreateImage({
      src: COMMON_API,
      name: COMMON_API,
      auth: MEDIA_AUTH.PUBLIC,
      info: {
        size: imageSize
      }
    })

    model.save()
    .then((image) => {
      imageId = image._id

      const { model: user, signToken } = mockCreateUser({
        username: COMMON_API,
        avatar: imageId
      })

      const { model: other } = mockCreateUser({
        username: COMMON_API,
      })

      const { model: other1 } = mockCreateUser({
        username: COMMON_API,
      })

      getToken = signToken

      return Promise.all([
        user.save(),
        other.save(),
        other1
      ])

    })
    .then(([user, other, other1]) => {
      userInfo = user
      anotherUserId = other._id
      anotherUser2Id = other1._id
      selfToken = getToken(userInfo._id)
      return ImageModel.updateOne({
        name: COMMON_API,
      }, {
        $set: { 
          origin: userInfo._id,
          white_list: [userInfo._id, anotherUserId, anotherUser2Id]
        }
      })
    })
    .then(_ => {
      done()
    })
    .catch(err => {
      console.log('oops: ', err)
    })

  })

  after(function(done) {

    Promise.all([
      ImageModel.deleteMany({
        $or: [
          {
            src: COMMON_API
          },
          {
            name: COMMON_API
          }
        ]
      }),
      UserModel.deleteMany({
        username: COMMON_API
      })
    ])
    .then(_ => {
      done()
    })
    .catch(err => {
      console.log('oops: ', err)
    })

  })
  
  describe(`delete the media white_list user success test -> ${COMMON_API}`, function() {

    it(`delete the media white_list user`, function(done) {

      Request
      .delete(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
        type: 0,
        _id: imageId.toString(),
        users: `${anotherUserId.toString()},${anotherUser2Id.toString()}`
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function(err) {
        if(err) return done(err)
        done()
      })

    })

  })

  describe(`delete the media white_list user fail test -> ${COMMON_API}`, function() {

    before(function(done) {
      ImageModel.updateOne({
        _id: imageId
      }, {
        $set: {
          white_list: [userInfo._id, anotherUserId, anotherUser2Id]
        }
      })
      .then(_ => {
        done()
      })
      .catch(err => {
        console.log('oops: ', err)
      })
    })

    it(`delete the media white_list user fail because lack of the type params`, function(done) {

      Request
      .delete(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
        _id: imageId.toString(),
        users: `${anotherUserId.toString()},${anotherUser2Id.toString()}`
      })
      .expect(400)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        done()
      })

    })

    it(`delete the media white_list user fail because the type params is not valid`, function(done) {

      Request
      .delete(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
        type: 3,
        _id: imageId.toString(),
        users: `${anotherUserId.toString()},${anotherUser2Id.toString()}`
      })
      .expect(400)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        done()
      })

    })

    it(`delete the media white_list user fail because the users is not valid`, function(done) {

      Request
      .delete(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
        type: 0,
        _id: imageId.toString(),
        users: `${anotherUserId.toString()},${anotherUser2Id.toString().slice(1)}`
      })
      .expect(400)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        done()
      })

    })

    it(`delete the media white_list user fail because lack of the users params`, function(done) {

      Request
      .delete(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
        type: 0,
        _id: imageId.toString(),
      })
      .expect(400)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        done()
      })

    })

  })

})