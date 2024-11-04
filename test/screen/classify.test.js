require('module-alias/register')
const { 
  UserModel, 
  ScreenMediaClassifyModel,
  ScreenMediaModel,
  ImageModel, 
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

const COMMON_API = '/api/screen/media-classify'

function responseExpect(res, validate=[]) {
  const { res: { data: target } } = res

  expect(target).to.be.a('object').and.that.includes.all.keys('total', 'list')

  target.list.forEach(item => {
    expect(item).to.be.a('object').that.includes.any.keys('_id', 'name', 'createdAt', 'updatedAt')
    commonValidate.objectId(item._id)
    commonValidate.string(item.name)
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
  let getToken
  let mediaId 

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
      const { model: media } = mockCreateScreenMedia({
        image: imageId
      })

      getToken = signToken

      return Promise.all([
        user.save(),
        media.save()
      ])

    })
    .then(([user, media]) => {
      userInfo = user 
      selfToken = getToken(userInfo._id)
      const { model } = mockCreateScreenMediaClassify({
        user: user._id,
        name: COMMON_API
      })
      mediaId = media._id 
      return model.save()
    })
    .then((data) => {
      classifyId = data._id
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
    ])
    .then(_ => {
      done()
    })
    .catch(err => {
      console.log('oops: ', err)
    })

  })
  
  describe(`get the screen media classify list success test -> ${COMMON_API}`, function() {

    it(`get the screen media classify success with content`, function(done) {

      Request
      .get(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
        content: COMMON_API
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        console.log(err, 22222)
        if(err) return done(err)
        console.log(err, 2227777)
        const { res: { text } } = res
        let obj
        try{
          obj = JSON.parse(text)
        }catch(_) {
          console.log(_)
        }
        console.log(obj, 2222)
        responseExpect(obj, (target) => {
          expect(target.list.length).to.be.not.equals(0)
        })
        done()
      })

    })

  })

  describe(`post new screen media classify success test -> ${COMMON_API}`, function() {

    let name = COMMON_API.slice(10)

    after(function(done) {

      ScreenMediaClassifyModel.findOne({
        name,
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

    it(`post new screen media classify success`, function(done) {

      Request
      .post(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        name,
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        done()
      })

    })

  })

  describe(`put the screen media classify success test -> ${COMMON_API}`, function() {

    let name = COMMON_API.slice(11)

    after(function(done) {

      ScreenMediaClassifyModel.findOne({
        name
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

    it(`put the screen media classify success`, function(done) {

      Request
      .put(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        _id: classifyId.toString(),
        name,
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        done()
      })

    })

  })

  describe(`delete the screen media classify success test -> ${COMMON_API}`, function() {

    let classifyIdA
    let classifyIdB
    let imageId 

    before(function(done) {

      const { model: classifyA } = mockCreateScreenMediaClassify({
        name: COMMON_API.slice(12),
        user: userInfo._id,
      })

      const { model: classifyB } = mockCreateScreenMediaClassify({
        name: COMMON_API.slice(13),
        user: userInfo._id,
      })

      Promise.all([
        classifyA.save(),
        classifyB.save(),
      ])
      .then(([classifyA, classifyB]) => {
        classifyIdA = classifyA._id
        classifyIdB = classifyB._id
        const { model } = mockCreateScreenMedia({
          classify: classifyA,
          image: imageId
        }) 
        return model.save()
      })
      .then(data => {
        imageId = data._id 
        done()
      })
      .catch(err => {
        console.log('oops: ', err)
      })

    })

    after(function(done) {

      ScreenMediaClassifyModel.find({
        _id: { $in: [classifyIdA, classifyIdB] }
      })
      .select({
        _id: 1
      })
      .exec()
      .then(data => {
        expect(!!data.length).to.be.false
        return ScreenMediaModel.find({
          image: imageId 
        })
        .select({
          _id: 1 
        })
        .exec()
      })
      .then(data => {
        expect(!!data.length).to.be.false
        done()
      })
      .catch(async (err) => {
        console.log('oops: ', err)
        await ScreenMediaClassifyModel.deleteMany({ _id: { $in: [ classifyIdA, classifyIdB ] } })
        done(err)
      })

    })

    it(`delete the screen media classify success`, function(done) {

      Request
      .delete(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
        _id: `${classifyIdA.toString()},${classifyIdB.toString()}`
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        done()
      })

    })

  })

  describe(`post new screen media classify fail test -> ${COMMON_API}`, function() {

    let name = COMMON_API.slice(14)

    it(`post new screen media classify fail because name is not verify`, function(done) {

      Request
      .post(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        name: name.repeat(5),
      })
      .expect(400)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        done()
      })

    })

    it(`post new screen media classify fail because lack of the name`, function(done) {

      Request
      .post(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({})
      .expect(400)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        done()
      })

    })

  })

  describe(`put the screen media classify fail test -> ${COMMON_API}`, function() {

    let name = COMMON_API.slice(15)

    it(`put screen media classify fail because name is not verify`, function(done) {

      Request
      .put(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        _id: classifyId.toString(),
        name: name.repeat(5),
      })
      .expect(400)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        done()
      })

    })

    it(`put screen media classify fail because lack of the name`, function(done) {

      Request
      .put(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        _id: classifyId.toString(),
      })
      .expect(400)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        done()
      })

    })

    it(`put screen media classify fail because _id is not verify`, function(done) {

      Request
      .put(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        name,
        _id: classifyId.toString().slice(1),
      })
      .expect(400)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        done()
      })

    })

    it(`put screen media classify fail because lack of the _id`, function(done) {

      Request
      .put(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        name: name,
      })
      .expect(404)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        done()
      })

    })

  })

  describe(`delete the screen media classify fail test -> ${COMMON_API}`, function() {

    let classifyId

    before(function(done) {
      const { model } = mockCreateScreenMediaClassify({
        name: COMMON_API,
        user: userInfo._id
      })

      model.save()
      .then((data) => {
        classifyId = data._id
        done()
      })
      .catch(err => {
        console.log('oops: ', err)
      })

    })
    
    it(`delete screen media classify fail because _id is not verify`, function(done) {

      Request
      .delete(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
        _id: classifyId.toString().slice(1),
      })
      .expect(400)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        done()
      })

    })

    it(`delete screen media classify fail because lack of the _id`, function(done) {

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
