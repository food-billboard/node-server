require('module-alias/register')
const { UserModel, ImageModel, MEDIA_ORIGIN_TYPE, MEDIA_AUTH, MEDIA_STATUS } = require('@src/utils')
const { expect } = require('chai')
const { Request, commonValidate, mockCreateUser, mockCreateImage } = require('@test/utils')

const COMMON_API = '/api/manage/media'

function responseExpect(res, validate=[]) {
  const { res: { data: target } } = res

  expect(target).to.be.a('object').and.that.include.all.keys('list', 'total')
  commonValidate.number(target.total)
  expect(target.list).to.be.a('array')

  target.list.forEach(item => {
    expect(item).to.be.a('object').that.includes.any.keys('_id', 'src', 'name', 'poster','createdAt', 'updatedAt', 'origin_type', 'origin', 'auth', 'info')
    commonValidate.objectId(item._id)
    commonValidate.string(item.src)
    commonValidate.string(item.name)
    commonValidate.date(item.createdAt)
    commonValidate.date(item.updatedAt)
    if(item.poster) {
      commonValidate.string(item.poster)
    }
    commonValidate.string(item.origin_type, (target) => {
      return !!MEDIA_ORIGIN_TYPE[target]
    })
    expect(item.origin).to.be.a('object')

    const { _id, name } = item.origin
    if(!!_id) commonValidate.objectId(_id)
    if(!!name) commonValidate.string(name)
    commonValidate.string(item.auth, (target) => {
      return !!MEDIA_AUTH[target]
    })
    expect(item.info).to.be.a('object').and.that.include.all.keys('md5', 'status', 'size', 'mime')
    commonValidate.string(item.info.md5)
    commonValidate.string(item.info.mime)
    commonValidate.number(item.info.size)
    commonValidate.string(item.info.status, (target) => {
      return !!MEDIA_STATUS[target]
    })
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
  let anotherUserId
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

      getToken = signToken

      return Promise.all([
        user.save(),
        other.save()
      ])

    })
    .then(([user, other]) => {
      userInfo = user
      anotherUserId = other._id
      selfToken = getToken(userInfo._id)
      return ImageModel.updateOne({
        origin: userInfo._id
      })
    })
    .then(_ => {
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
      })
    ])
    .then(_ => {
      done()
    })
    .catch(err => {
      console.log('oops: ', err)
    })

  })
  
  describe(`get the media list success test -> ${COMMON_API}`, function() {

    it(`get the media success with id`, function(done) {

      Request
      .get(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
        type: 0,
        _id: imageId.toString(),
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
          expect(target.length).to.be.not.equals(0)
        })
        done()
      })

    })

    it(`get the media success with content`, function(done) {

      Request
      .get(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
        type: 0,
        content: COMMON_API
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
          expect(target.length).to.be.not.equals(0)
        })
        done()
      })

    })

    it(`get the media success and with origin_type`, function(done) {
      Request
      .get(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
        type: 0,
        origin_type: MEDIA_ORIGIN_TYPE.USER
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
          expect(target.list.length > 1).to.be.true
        })
        done()
      })

    })

    it(`get the media success and with auth`, function(done) {

      Request
      .get(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
        type: 0,
        auth: MEDIA_AUTH.PRIVATE
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
          const allNotEq = target.list.every(item => {
            const _id = item._id.toString()
            return _id != imageId.toString()
          })
          expect(allNotEq).to.be.true
        })
        done()
      })

    })

    it(`get the media success and with status`, function(done) {
      Request
      .get(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
        type: 0,
        status: MEDIA_STATUS.ERROR
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
          const allNotEq = target.list.every(item => {
            const _id = item._id.toString()
            return _id != imageId.toString()
          })
          expect(allNotEq).to.be.true
        })
        done()
      })

    })

    it(`get the media success and with size of number`, function(done) {
      Request
      .get(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
        type: 0,
        size: imageSize
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
          const allNotEq = target.list.some(item => {
            const _id = item._id.toString()
            return _id == imageId.toString()
          })
          expect(allNotEq).to.be.true
        })
        done()
      })

    })

    it(`get the media success and with size of number,number`, function(done) {
      Request
      .get(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
        type: 0,
        size: `0,${imageSize}`
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
          const allNotEq = target.list.some(item => {
            const _id = item._id.toString()
            return _id == imageId.toString()
          })
          expect(allNotEq).to.be.true
        })
        done()
      })

    })

    it(`get the media success and with size of number,`, function(done) {
      Request
      .get(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
        type: 0,
        size: `${imageSize},`
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
          const allNotEq = target.list.some(item => {
            const _id = item._id.toString()
            return _id == imageId.toString()
          })
          expect(allNotEq).to.be.true
        })
        done()
      })

    })

  })

  describe(`put the media success test -> ${COMMON_API}`, function() {

    let status = MEDIA_STATUS.UPLOADING

    after(function(done) {

      ImageModel.findOne({
        "info.status": status
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

    it(`put the media success`, function(done) {

      Request
      .put(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        type: 0,
        _id: imageId.toString(),
        name: COMMON_API,
        auth: MEDIA_AUTH.PUBLIC,
        status
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        done()
      })

    })

  })

  describe(`delete the media success test -> ${COMMON_API}`, function() {

    let imageIdA
    let imageIdB

    before(function(done) {

      const { model: imageA } = mockCreateImage({
        src: COMMON_API + 'delete-s-1',
        name: COMMON_API,
        auth: MEDIA_AUTH.PUBLIC,
        info: {
          size: imageSize
        },
        origin: userInfo._id
      })
      const { model: imageB } = mockCreateImage({
        src: COMMON_API + 'delete-s-2',
        name: COMMON_API,
        auth: MEDIA_AUTH.PUBLIC,
        info: {
          size: imageSize
        },
        origin: userInfo._id
      })

      Promise.all([
        imageA.save(),
        imageB.save()
      ])
      .then(([imageA, imageB]) => {
        imageIdA = imageA._id
        imageIdB = imageB._id
        done()
      })
      .catch(err => {
        console.log('oops: ', err)
      })

    })

    after(function(done) {

      ImageModel.find({
        _id: { $in: [imageIdA, imageIdB] }
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
        await ImageModel.deleteMany({ _id: { $in: [ imageIdA, imageIdB ] } })
        done(err)
      })

    })

    it(`delete the media success`, function(done) {

      Request
      .delete(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
        type: 0,
        _id: `${imageIdA.toString()},${imageIdB.toString()}`
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        done()
      })

    })

  })

  describe(`get the media list fail test -> ${COMMON_API}`, function() {

    it(`get the media list fail because lack of the type params`, function(done) {

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

    it(`get the media list fail because the type params is not valid`, function(done) {

      Request
      .get(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
        type: 3
      })
      .expect(400)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        done()
      })

    })

  })

  describe(`put the media fail test -> ${COMMON_API}`, function() {

    after(function(done) {
      ImageModel.findOne({
        $or: [
          {
            name: ''
          },
          {
            auth: ''
          },
          {
            "info.status": ''
          }
        ]
      })
      .select({
        _id: 1
      })
      .exec()
      .then(data => {
        expect(!!data).to.be.false 
        done()
      })
      .catch(err => {
        console.log('oops: ', err)
        done(err)
      })
    })

    it(`put the media list fail because lack of the type params`, function(done) {

      Request
      .put(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        _id: imageId.toString(),
        name: COMMON_API,
        auth: MEDIA_AUTH.PUBLIC,
        status: MEDIA_STATUS.COMPLETE
      })
      .expect(400)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        done()
      })

    })

    it(`put the media list fail because the type params is not valid`, function(done) {

      Request
      .put(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        type: 3,
        _id: imageId.toString(),
        name: COMMON_API,
        auth: MEDIA_AUTH.PUBLIC,
        status: MEDIA_STATUS.COMPLETE
      })
      .expect(400)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        done()
      })

    })

    it(`put media fail because name is not verify`, function(done) {

      Request
      .put(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        type: 0,
        _id: imageId.toString(),
        name: '',
        auth: MEDIA_AUTH.PUBLIC,
        status: MEDIA_STATUS.COMPLETE
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        done()
      })

    })

    it(`put media fail because auth is not verify`, function(done) {

      Request
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
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        done()
      })

    })

    it(`put media fail because status is not verify`, function(done) {

      Request
      .put(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        type: 0,
        _id: imageId.toString(),
        name: COMMON_API,
        auth: MEDIA_AUTH.PUBLIC,
        status: ''
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        done()
      })

    })

    it(`put media fail because lack of the name`, function(done) {

      Request
      .put(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        type: 0,
        _id: imageId.toString(),
        auth: MEDIA_AUTH.PUBLIC,
        status: MEDIA_STATUS.COMPLETE
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        done()
      })

    })

    it(`put media fail because lack of the auth`, function(done) {

      Request
      .put(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        type: 0,
        _id: imageId.toString(),
        name: COMMON_API,
        status: MEDIA_STATUS.COMPLETE
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        done()
      })

    })

    it(`put media fail because lack of the status`, function(done) {

      Request
      .put(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        type: 0,
        _id: imageId.toString(),
        name: COMMON_API,
        auth: MEDIA_AUTH.PUBLIC,
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        done()
      })

    })

    it(`put media fail because _id is not verify`, function(done) {

      Request
      .put(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        type: 0,
        _id: '',
        name: COMMON_API,
        auth: MEDIA_AUTH.PUBLIC,
        status: MEDIA_STATUS.COMPLETE
      })
      .expect(400)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        done()
      })

    })

    it(`put media fail because lack of the _id`, function(done) {

      Request
      .put(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        type: 0,
        name: COMMON_API,
        auth: MEDIA_AUTH.PUBLIC,
        status: MEDIA_STATUS.COMPLETE
      })
      .expect(400)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        done()
      })

    })

    it(`put media fail because not the auth`, async function() {

      let res = true

      await UserModel.updateOne({
        _id: userInfo._id
      }, {
        $set: { roles: [ 'CUSTOMER' ] }
      })
      .catch(err => {
        res = false
        console.log('oops: ', err)
      })

      Request
      .put(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        type: 0,
        _id: imageId.toString(),
        name: COMMON_API,
        auth: MEDIA_AUTH.PUBLIC,
        status: MEDIA_STATUS.COMPLETE
      })
      .expect(403)
      .expect('Content-Type', /json/)

      await UserModel.updateOne({
        _id: userInfo._id
      }, {
        $set: { roles: [ 'SUPER_ADMIN' ] }
      })
      .catch(err => {
        res = false
        console.log('oops: ', err)
      })

      return res ? Promise.resolve() : Promise.reject(COMMON_API)

    })

  })

  describe(`delete the media fail test -> ${COMMON_API}`, function() {

    let imageId

    before(function(done) {
      const { model } = mockCreateImage({
        src: COMMON_API,
        name: COMMON_API,
        auth: MEDIA_AUTH.PUBLIC,
        info: {
          size: imageSize
        },
        origin: anotherUserId
      })

      Promise.all([
        UserModel.updateOne({
          _id: anotherUserId
        }, {
          $set: { roles: [ 'CUSTOMER' ] }
        }),
        model.save()
      ])
      .then(([, data]) => {
        imageId = data._id
        done()
      })
      .catch(err => {
        console.log('oops: ', err)
      })

    })

    it(`delete the media list fail because lack of the type params`, function(done) {

      Request
      .delete(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
        _id: imageId.toString()
      })
      .expect(400)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        done()
      })

    })

    it(`delete the media list fail because the type params is not valid`, function(done) {

      Request
      .delete(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
        _id: imageId.toString(),
        type: 3
      })
      .expect(400)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        done()
      })

    })
    
    it(`delete media fail because _id is not verify`, function(done) {

      Request
      .delete(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
        type: 0,
        _id: imageId.toString().slice(1),
      })
      .expect(400)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        done()
      })

    })

    it(`delete media fail because lack of the _id`, function(done) {

      Request
      .delete(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
        type: 0
      })
      .expect(400)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        done()
      })

    })

    it(`delete media fail because not the auth`, async function() {

      let res = true

      await UserModel.updateOne({
        _id: userInfo._id
      }, {
        $set: { roles: [ 'CUSTOMER' ] }
      })
      .catch(err => {
        res = false
        console.log('oops: ', err)
      })

      Request
      .delete(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        type: 0,
        _id: imageId.toString(),
      })
      .expect(403)
      .expect('Content-Type', /json/)

      await UserModel.updateOne({
        _id: userInfo._id
      }, {
        $set: { roles: [ 'SUPER_ADMIN' ] }
      })
      .catch(err => {
        res = false
        console.log('oops: ', err)
      })

      return res ? Promise.resolve() : Promise.reject(COMMON_API)

    })

  })
})