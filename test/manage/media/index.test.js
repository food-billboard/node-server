require('module-alias/register')
const { UserModel, ImageModel } = require('@src/utils')
const { expect } = require('chai')
const { Request, commonValidate, mockCreateUser, mockCreateImage, MEDIA_ORIGIN_TYPE, MEDIA_AUTH, MEDIA_STATUS } = require('@test/utils')

const COMMON_API = '/api/manage/media'

function responseExpect(res, validate=[]) {
  const { res: { data: target } } = res

  expect(target).to.be.a('object').and.that.include.all.keys('list', 'total')
  commonValidate.number(target.total)
  expect(target.list).to.be.a('array')

  target.list.forEach(item => {
    expect(item).to.be.a('object').that.includes.all.keys('_id', 'src', 'name', 'createdAt', 'updatedAt', 'origin_type', 'origin', 'auth', 'info')
    commonValidate.objectId(item._id)
    commonValidate.string(item.src)
    commonValidate.string(item.name)
    commonValidate.date(item.createdAt)
    commonValidate.date(item.updatedAt)
    commonValidate.string(item.origin_type, (target) => {
      return !!MEDIA_ORIGIN_TYPE[target]
    })
    expect(item.origin).to.be.a('object').and.that.include.all.keys('_id', 'name')
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

  before(function(done) {

    const { model } = mockCreateImage({
      src: COMMON_API,
      name: COMMON_API
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
  
  describe(`get the media list success test -> ${COMMON_API}`, function() {

    it(`get the media success with id`, function(done) {

      Request
      .get(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
        _id: actorId.toString(),
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
      const { model } = mockCreateActor({
        name: COMMON_API + 'limit',
        other: {
          avatar: imageId
        },
        country: districtId,
        source: userInfo._id
      })

      model.save()
      .then(_ => {
        return Request
        .get(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .query({
          currPage: 0,
          pageSize: 1,
          all: 1
        })
        .expect(200)
        .expect('Content-Type', /json/)
      })
      .then(function(res) {
        if(err) return done(err)
        const { res: { text } } = res
        let obj
        try{
          obj = JSON.parse(text)
        }catch(_) {
          console.log(_)
        }
        responseExpect(obj, (target) => {
          expect(target.length > 1).to.be.true
        })
        done()
      })

    })

    it(`get the media success and with auth`, function(done) {
      const { model } = mockCreateActor({
        name: COMMON_API + 'limit',
        other: {
          avatar: imageId
        },
        country: districtId,
        source: userInfo._id
      })

      model.save()
      .then(_ => {
        return Request
        .get(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .query({
          currPage: 0,
          pageSize: 1,
          all: 1
        })
        .expect(200)
        .expect('Content-Type', /json/)
      })
      .then(function(res) {
        if(err) return done(err)
        const { res: { text } } = res
        let obj
        try{
          obj = JSON.parse(text)
        }catch(_) {
          console.log(_)
        }
        responseExpect(obj, (target) => {
          expect(target.length > 1).to.be.true
        })
        done()
      })

    })

    it(`get the media success and with status`, function(done) {
      const { model } = mockCreateActor({
        name: COMMON_API + 'limit',
        other: {
          avatar: imageId
        },
        country: districtId,
        source: userInfo._id
      })

      model.save()
      .then(_ => {
        return Request
        .get(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .query({
          currPage: 0,
          pageSize: 1,
          all: 1
        })
        .expect(200)
        .expect('Content-Type', /json/)
      })
      .then(function(res) {
        if(err) return done(err)
        const { res: { text } } = res
        let obj
        try{
          obj = JSON.parse(text)
        }catch(_) {
          console.log(_)
        }
        responseExpect(obj, (target) => {
          expect(target.length > 1).to.be.true
        })
        done()
      })

    })

    it(`get the media success and with size of number`, function(done) {
      const { model } = mockCreateActor({
        name: COMMON_API + 'limit',
        other: {
          avatar: imageId
        },
        country: districtId,
        source: userInfo._id
      })

      model.save()
      .then(_ => {
        return Request
        .get(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .query({
          currPage: 0,
          pageSize: 1,
          all: 1
        })
        .expect(200)
        .expect('Content-Type', /json/)
      })
      .then(function(res) {
        if(err) return done(err)
        const { res: { text } } = res
        let obj
        try{
          obj = JSON.parse(text)
        }catch(_) {
          console.log(_)
        }
        responseExpect(obj, (target) => {
          expect(target.length > 1).to.be.true
        })
        done()
      })

    })

    it(`get the media success and with size of number,number`, function(done) {
      const { model } = mockCreateActor({
        name: COMMON_API + 'limit',
        other: {
          avatar: imageId
        },
        country: districtId,
        source: userInfo._id
      })

      model.save()
      .then(_ => {
        return Request
        .get(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .query({
          currPage: 0,
          pageSize: 1,
          all: 1
        })
        .expect(200)
        .expect('Content-Type', /json/)
      })
      .then(function(res) {
        if(err) return done(err)
        const { res: { text } } = res
        let obj
        try{
          obj = JSON.parse(text)
        }catch(_) {
          console.log(_)
        }
        responseExpect(obj, (target) => {
          expect(target.length > 1).to.be.true
        })
        done()
      })

    })

    it(`get the media success and with size of number,`, function(done) {
      const { model } = mockCreateActor({
        name: COMMON_API + 'limit',
        other: {
          avatar: imageId
        },
        country: districtId,
        source: userInfo._id
      })

      model.save()
      .then(_ => {
        return Request
        .get(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .query({
          currPage: 0,
          pageSize: 1,
          all: 1
        })
        .expect(200)
        .expect('Content-Type', /json/)
      })
      .then(function(res) {
        if(err) return done(err)
        const { res: { text } } = res
        let obj
        try{
          obj = JSON.parse(text)
        }catch(_) {
          console.log(_)
        }
        responseExpect(obj, (target) => {
          expect(target.length > 1).to.be.true
        })
        done()
      })

    })

  })

  describe(`put the media success test -> ${COMMON_API}`, function() {

    let name = COMMON_API.slice(21)

    after(function(done) {

      ImageModel.findOne({
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

    it(`put the media success`, function(done) {

      Request
      .put(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        _id: actorId.toString(),
        name,
        alias: name,
        avatar: imageId.toString(),
        country: districtId.toString()
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

      const { model: actorA } = mockCreateImage({
        name: COMMON_API.slice(22),
        source: anotherUserId,
        country: districtId,
      })
      const { model: actorB } = mockCreateImage({
        name: COMMON_API.slice(23),
        source: anotherUserId,
        country: districtId,
      })

      Promise.all([
        actorA.save(),
        actorB.save(),
        UserModel.updateOne({
          _id: anotherUserId
        }, {
          $set: { roles: [ 'CUSTOMER' ] }
        })
      ])
      .then(([actorA, actorB]) => {
        actorIdA = actorA._id
        actorIdB = actorB._id
        done()
      })
      .catch(err => {
        console.log('oops: ', err)
      })

    })

    after(function(done) {

      ActorModel.find({
        _id: { $in: [actorIdA, actorIdB] }
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
        await ActorModel.deleteMany({ _id: { $in: [ actorIdA, actorIdB ] } })
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
        _id: `${actorIdA.toString()},${actorIdB.toString()}`
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
      .expect(400)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        done()
      })

    })

  })

  describe(`put the media fail test -> ${COMMON_API}`, function() {

    let name = COMMON_API.slice(24)

    it(`put the media list fail because lack of the type params`, function(done) {

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

    it(`put the media list fail because the type params is not valid`, function(done) {

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

    it(`put media fail because name is not verify`, function(done) {

      Request
      .put(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        _id: actorId.toString(),
        name: name.repeat(5),
        alias: name,
        avatar: imageId.toString(),
        country: districtId.toString()
      })
      .expect(400)
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
        _id: actorId.toString(),
        name: name,
        alias: name,
        avatar: imageId.toString(),
        country: districtId.toString().slice(1),
      })
      .expect(400)
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
        _id: actorId.toString(),
        name: name,
        alias: name,
        avatar: imageId.toString(),
        country: districtId.toString().slice(1),
      })
      .expect(400)
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
        _id: actorId.toString(),
        alias: name,
        avatar: imageId.toString(),
        country: districtId.toString()
      })
      .expect(400)
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
        _id: actorId.toString(),
        alias: name,
        avatar: imageId.toString(),
        country: districtId.toString()
      })
      .expect(400)
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
        _id: actorId.toString(),
        alias: name,
        avatar: imageId.toString(),
        country: districtId.toString()
      })
      .expect(400)
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
        name: name,
        alias: name,
        avatar: imageId.toString(),
        _id: actorId.toString().slice(1),
        country: districtId.toString()
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
        name: name,
        alias: name,
        avatar: imageId.toString(),
        country: districtId.toString()
      })
      .expect(404)
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
        _id: actorId.toString(),
        name: name,
        alias: name,
        avatar: imageId.toString(),
        country: districtId.toString()
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

    let actorId

    before(function(done) {
      const { model } = mockCreateActor({
        name: COMMON_API,
        source: anotherUserId,
        country: districtId,
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
        actorId = data._id
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
        _id: actorId.toString().slice(1),
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
      .expect(404)
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
        _id: actorId.toString(),
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