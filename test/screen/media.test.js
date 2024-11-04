require('module-alias/register')
const mongoose = require('mongoose')
const { 
  UserModel, 
  ScreenMediaClassifyModel,
  ImageModel, 
  ScreenMediaModel 
} = require('@src/utils')
const { expect } = require('chai')
const { 
  Request, 
  commonValidate, 
  mockCreateUser, 
  mockCreateImage, 
  mockCreateScreenMediaClassify,
  mockCreateScreenMedia,
} = require('@test/utils')

const { Types: { ObjectId } } = mongoose

const COMMON_API = '/api/screen/media'

function responseExpect(res, validate=[]) {
  const { res: { data: target } } = res

  expect(target).to.be.a('object').and.that.includes.all.keys('total', 'list')

  target.list.forEach(item => {
    expect(item).to.be.a('object').that.includes.any.keys('_id', 'src', 'image_id', 'createdAt', 'updatedAt', 'classify')
    commonValidate.objectId(item._id)
    commonValidate.string(item.src)
    commonValidate.objectId(item.image_id)
    commonValidate.date(item.createdAt)
    commonValidate.date(item.updatedAt)
  })

  if(Array.isArray(validate)) {
    validate.forEach(valid => {
      typeof valid == 'function' && valid(target)
    })
  }else if(typeof validate === 'function') {
    validate(target)
  }
}

describe(`${COMMON_API} test`, () => {

  let userInfo
  let selfToken
  let imageId
  let classifyId
  let mediaId 
  let getToken

  before(function(done) {

    const { model } = mockCreateImage({
      src: COMMON_API
    })

    model.save()
    .then(data => {
      imageId = data._id

      const { model: user, signToken } = mockCreateUser({
        username: COMMON_API,
        avatar: imageId
      })

      getToken = signToken

      return user.save()

    })
    .then(data => {
      const { model } = mockCreateScreenMediaClassify({
        user: data._id 
      })
      userInfo = data 
      selfToken = getToken(userInfo._id)
      return model.save()
    })
    .then((data) => {
      classifyId = data._id
      const { model } = mockCreateScreenMedia({
        classify: classifyId,
        image: imageId
      })
      return model.save()
    })
    .then(data => {
      mediaId = data._id 
      done()
    })
    .catch(err => {
      console.log('oops: ', err)
    })

  })

  after(function(done) {

    Promise.all([
      ImageModel.deleteMany({
        src: COMMON_API
      }),
      UserModel.deleteMany({
        username: COMMON_API
      }),
      ScreenMediaClassifyModel.deleteMany({
        user: {
          $in: [userInfo._id]
        }
      }),
      ScreenMediaModel.deleteMany({
        $or: [
          {
            user: {
              $in: [userInfo._id]
            }
          },
          {
            classify: {
              $in: [classifyId]
            }
          }
        ]
      })
    ])
    .then(_ => {
      done()
    })
    .catch(err => {
      console.log('oops: ', err)
    })

  })
  
  describe(`get the screen media list success test -> ${COMMON_API}`, function() {

    it(`get the screen media success`, function(done) {

      Request
      .get(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
        _id: classifyId.toString()
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
        responseExpect(obj, (target) => {
          expect(target.list.length).to.be.not.equals(0)
        })
        done()
      })

    })

  })

  describe(`post new screen media success test -> ${COMMON_API}`, function() {

    const imageId = ObjectId('5edb3c7b4f88da14ca419e61')

    after(function(done) {

      ScreenMediaModel.findOne({
        image: imageId
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

    it(`post new screen media success`, function(done) {

      Request
      .post(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        _id: classifyId.toString(),
        image: imageId.toString()
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        done()
      })

    })

  })

  describe(`delete the screen media success test -> ${COMMON_API}`, function() {

    let mediaIdA
    let mediaIdB

    before(function(done) {

      const { model: mediaA } = mockCreateScreenMedia({
        image: imageId,
        classify: classifyId
      })

      const { model: mediaB } = mockCreateScreenMedia({
        image: imageId,
        classify: classifyId
      })

      Promise.all([
        mediaA.save(),
        mediaB.save(),
      ])
      .then(([mediaA, mediaB]) => {
        mediaIdA = mediaA._id
        mediaIdB = mediaB._id
        done()
      })
      .catch(err => {
        console.log('oops: ', err)
      })

    })

    after(function(done) {

      ScreenMediaModel.find({
        _id: { $in: [mediaIdA, mediaIdB] }
      })
      .select({
        _id: 1
      })
      .exec()
      .then(data => {
        expect(!!data.length).to.be.false
        done()
      })
      .catch(async (err) => {
        console.log('oops: ', err)
        await ScreenMediaModel.deleteMany({ _id: { $in: [ mediaIdA, mediaIdB ] } })
        done(err)
      })

    })

    it(`delete the screen media success`, function(done) {

      Request
      .delete(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
        _id: `${mediaIdA.toString()},${mediaIdB.toString()}`
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        done()
      })

    })

  })

  describe(`get the screen media list fail test -> ${COMMON_API}`, function() {

    it(`get the screen media list fail because lack of the params`, function(done) {

      Request
      .get(COMMON_API)
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

  })

  describe(`post new screen media fail test -> ${COMMON_API}`, function() {

    let name = COMMON_API.slice(23)

    it(`post screen media fail because _id is not verify`, function(done) {

      Request
      .post(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
        _id: classifyId.toString().slice(1),
        image: imageId.toString()
      })
      .expect(400)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        done()
      })

    })

    it(`post screen media fail because lack of the _id`, function(done) {

      Request
      .post(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
        image: imageId.toString()
      })
      .expect(400)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        done()
      })

    })

    it(`post screen media fail because image _id is not verify`, function(done) {

      Request
      .post(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
        _id: classifyId.toString(),
        image: imageId.toString().slice(1)
      })
      .expect(400)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        done()
      })

    })

    it(`post screen media fail because lack of the image _id`, function(done) {

      Request
      .post(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
        _id: classifyId.toString()
      })
      .expect(400)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        done()
      })

    }) 

  })

  describe(`delete the screen media fail test -> ${COMMON_API}`, function() {

    let mediaId

    before(function(done) {
      const { model } = mockCreateScreenMedia({
        image: imageId,
        classify: classifyId
      })

      model.save()
      .then((data) => {
        mediaId = data._id
        done()
      })
      .catch(err => {
        console.log('oops: ', err)
      })

    })
    
    it(`delete screen media fail because _id is not verify`, function(done) {

      Request
      .delete(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
        _id: mediaId.toString().slice(1),
      })
      .expect(400)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        done()
      })

    })

    it(`delete screen media fail because lack of the _id`, function(done) {

      Request
      .delete(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .expect(404)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        done()
      })

    })

  })

})
