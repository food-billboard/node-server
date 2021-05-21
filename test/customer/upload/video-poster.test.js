require('module-alias/register')
const { UserModel, ImageModel, MEDIA_ORIGIN_TYPE, MEDIA_AUTH, MEDIA_STATUS, VideoModel } = require('@src/utils')
const { expect } = require('chai')
const { Types: { ObjectId } } = require('mongoose')
const { Request, mockCreateUser, mockCreateImage, mockCreateVideo } = require('@test/utils')

const COMMON_API = '/api/customer/upload/video/poster'

describe(`${COMMON_API} test`, () => {

  let userInfo
  let selfToken
  let imageId
  let videoId 
  let getToken

  before(function(done) {

    const { model } = mockCreateImage({
      src: COMMON_API,
      name: COMMON_API,
      auth: MEDIA_AUTH.PUBLIC,
    })

    const { model: video } = mockCreateVideo({
      src: COMMON_API,
      name: COMMON_API,
      auth: MEDIA_AUTH.PRIVATE,
      origin_type: MEDIA_ORIGIN_TYPE.ORIGIN,
    })

    Promise.all([
      model.save(),
      video.save(),
    ])
    .then(([image, video]) => {
      imageId = image._id
      videoId = video._id

      const { model: user, signToken } = mockCreateUser({
        username: COMMON_API,
        avatar: imageId
      })

      getToken = signToken

      return user.save()

    })
    .then((user) => {
      userInfo = user
      selfToken = getToken(userInfo._id)
      done()
    })
    .catch(err => {
      console.log('oops: ', err)
      done(err)
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
      }),
      VideoModel.deleteMany({
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

  describe(`put the video poster success test -> ${COMMON_API}`, function() {

    after(function(done) {

      VideoModel.findOne({
        poster: imageId
      })
      .select({
        _id: 1
      })
      .exec()
      .then(data => {
        expect(!!data).to.be.true
        done()
      })
      .catch(err => {
        console.log('oops: ', err)
      })

    })

    it(`put the video poster and user is max role success`, function(done) {

      UserModel.updateMany({
        _id: userInfo._id 
      }, {
        $set: {
          roles: ["SUPER_ADMIN"]
        }
      })
      .then(_ => {
        Request
        .put(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .send({
          data: `${videoId.toString()}-${imageId.toString()}`
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if(err) return done(err)
          done()
        })
      })
      .catch(err => {
        done(err)
      })

    })

    it(`put the video poster and white_list includes the user success`, function(done) {

      Promise.all([
        UserModel.updateMany({
          _id: userInfo._id 
        }, {
          $set: {
            roles: ["CUSTOMER"]
          }
        }),
        VideoModel.updateMany({
          _id: videoId
        }, {
          $set: {
            white_list: [userInfo._id],
            origin_type: MEDIA_ORIGIN_TYPE.USER,
            auth: MEDIA_AUTH.PRIVATE
          }
        })
      ])
      .then(_ => {
        Request
        .put(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .send({
          data: `${videoId.toString()}-${imageId.toString()}`
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if(err) return done(err)
          done()
        })
      })
      .catch(err => {
        done(err)
      })

    })

    it(`put the video poster and the auth is public success`, function(done) {

      Promise.all([
        UserModel.updateMany({
          _id: userInfo._id 
        }, {
          $set: {
            roles: ["CUSTOMER"]
          }
        }),
        VideoModel.updateMany({
          _id: videoId
        }, {
          $set: {
            white_list: [],
            auth: MEDIA_AUTH.PUBLIC
          }
        })
      ])
      .then(_ => {
        Request
        .put(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .send({
          data: `${videoId.toString()}-${imageId.toString()}`
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if(err) return done(err)
          done()
        })
      })
      .catch(err => {
        done(err)
      })

    })

  })

  describe(`put the media fail test -> ${COMMON_API}`, function() {

    const id = ObjectId("8f63270f005f1c1a0d9448ca")

    before(function(done) {
      VideoModel.updateMany({
        src: COMMON_API
      }, {
        $set: {
          poster: id
        }
      })
      .then(_ => {
        done()
      })
      .catch(err => {
        done(err)
      })
    })

    after(function(done) {
      VideoModel.findOne({
        poster: id 
      })
      .select({
        _id: 1
      })
      .exec()
      .then(data => {
        expect(!!data).to.be.true 
        done()
      })
      .catch(err => {
        console.log('oops: ', err)
        done(err)
      })
    })

    it(`put the video poster fail because lack of the params`, function(done) {

      Request
      .put(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .expect(400)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        done()
      })

    })

    it(`put the video poster fail because the type params is not valid`, function(done) {

      Request
      .put(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        data: `${videoId.toString()}`
      })
      .expect(400)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        done()
      })

    })

    it(`put video poster fail because videoid is not verify`, function(done) {

      Request
      .put(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        data: `${videoId.toString().slice(1)}-${imageId.toString()}`
      })
      .expect(400)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        done()
      })

    })

    it(`put video poster fail because imageid is not verify`, function(done) {

      Request
      .put(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        data: `${videoId.toString()}-${imageId.toString().slice(1)}`
      })
      .expect(400)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        done()
      })

    })

    it(`put video poster fail because auth is not verify`, function(done) {

      Promise.all([
        UserModel.updateMany({
          _id: userInfo._id 
        }, {
          $set: {
            roles: ["CUSTOMER"]
          }
        }),
        VideoModel.updateMany({
          _id: videoId
        }, {
          $set: {
            white_list: [],
            origin_type: MEDIA_ORIGIN_TYPE.USER,
            auth: MEDIA_AUTH.PRIVATE
          }
        })
      ])
      .then(_ => {
        return Request
        .put(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .send({
          type: 0,
          _id: imageId.toString(),
          name: COMMON_API,
          auth: '',
          status: MEDIA_STATUS.COMPLETE
        })
        .expect(400)
        .expect('Content-Type', /json/)
      })
      .then(_ => {
        done()
      })
      .catch(err => {
        done(err)
      })

    })

    it(`put video poster fail because the media is ORIGIN`, function(done) {

      Promise.all([
        UserModel.updateMany({
          _id: userInfo._id 
        }, {
          $set: {
            roles: ["CUSTOMER"]
          }
        }),
        VideoModel.updateMany({
          _id: videoId
        }, {
          $set: {
            white_list: [userInfo._id],
            origin_type: MEDIA_ORIGIN_TYPE.ORIGIN,
            auth: MEDIA_AUTH.PUBLIC
          }
        })
      ])
      .then(_ => {
        return Request
        .put(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .send({
          type: 0,
          _id: imageId.toString(),
          name: COMMON_API,
          auth: '',
          status: MEDIA_STATUS.COMPLETE
        })
        .expect(400)
        .expect('Content-Type', /json/)
      })
      .then(() => {
        done()
      })
      .catch(err => {
        done(err)
      })

    })

  })

})