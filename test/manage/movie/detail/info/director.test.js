require('module-alias/register')
const { UserModel, DirectorModel, ImageModel, DistrictModel } = require('@src/utils')
const { expect } = require('chai')
const { Request, commonValidate, mockCreateUser, mockCreateDirector, mockCreateImage, mockCreateDistrict } = require('@test/utils')

const COMMON_API = '/api/manage/movie/detail/info/director'

function responseExpect(res, validate=[]) {
  const { res: { data: target } } = res

  expect(target).to.be.a('array')

  target.forEach(item => {
    expect(item).to.be.a('object').that.includes.all.keys('_id', 'another_name', 'name', 'createdAt', 'updatedAt', 'avatar', 'source_type', 'country')
    commonValidate.objectId(item._id)
    commonValidate.string(item.another_name)
    commonValidate.string(item.name)
    commonValidate.poster(item.avatar)
    commonValidate.string(item.source_type)
    commonValidate.date(item.createdAt)
    commonValidate.date(item.updatedAt)
    expect(item.country).to.be.a('object').and.that.include.all.keys('_id', 'name')
    commonValidate.string(item.country.name)
    commonValidate.objectId(item.country._id)
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
  let directorId
  let districtId
  let getToken

  before(function(done) {

    const { model } = mockCreateImage({
      src: COMMON_API
    })
    const { model: district } = mockCreateDistrict({
      name: COMMON_API
    })

    Promise.all([
      model.save(),
      district.save()
    ])
    .then(([image, district]) => {
      imageId = image._id
      districtId = district._id

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
      const { model } = mockCreateDirector({
        name: COMMON_API,
        other: {
          avatar: imageId
        },
        country: districtId,
        source: userInfo._id
      })

      return model.save()
    })
    .then((data) => {
      directorId = data._id
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
      DirectorModel.deleteMany({
        source: { $in: [ userInfo._id, anotherUserId ] }
      }),
      DistrictModel.deleteMany({
        name: COMMON_API
      })
    ])
    .then(_ => {
      done()
    })
    .catch(err => {
      console.log('oops: ', err)
    })

  })
  
  describe(`get the director list success test -> ${COMMON_API}`, function() {

    it(`get the director success with id`, function(done) {

      Request
      .get(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
        _id: directorId.toString(),
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

    it(`get the director success with content`, function(done) {

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

    it(`get the director success and with all`, function(done) {
      const { model } = mockCreateDirector({
        name: COMMON_API,
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

  describe(`post new director success test -> ${COMMON_API}`, function() {

    let name = COMMON_API.slice(20)

    after(function(done) {

      DirectorModel.findOne({
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

    it(`post new director success`, function(done) {

      Request
      .post(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
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

  describe(`put the director success test -> ${COMMON_API}`, function() {

    let name = COMMON_API.slice(21)

    after(function(done) {

      DirectorModel.findOne({
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

    it(`put the director success`, function(done) {

      Request
      .put(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        _id: directorId.toString(),
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

  describe(`delete the director success test -> ${COMMON_API}`, function() {

    let directorIdA
    let directorIdB

    before(function(done) {

      const { model: directorA } = mockCreateDirector({
        name: COMMON_API.slice(22),
        source: anotherUserId,
        country: districtId
      })

      const { model: directorB } = mockCreateDirector({
        name: COMMON_API.slice(23),
        source: anotherUserId,
        country: districtId
      })

      Promise.all([
        directorA.save(),
        directorB.save(),
        UserModel.updateOne({
          _id: anotherUserId
        }, {
          $set: { roles: [ 'CUSTOMER' ] }
        })
      ])
      .then(([directorA, directorB]) => {
        directorIdA = directorA._id
        directorIdB = directorB._id
        done()
      })
      .catch(err => {
        console.log('oops: ', err)
        done(err)
      })

    })

    after(function(done) {

      DirectorModel.find({
        _id: { $in: [ directorIdA, directorIdB ] }
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
        await DirectorModel.deleteMany({ _id: { $in: [ directorIdA, directorIdB ] } })
        done(err)
      })

    })

    it(`delete the director success`, function(done) {

      Request
      .delete(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
        _id: `${directorIdA.toString()},${directorIdB.toString()}`
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        done()
      })

    })

  })

  describe(`get the director list fail test -> ${COMMON_API}`, function() {

    // it(`get the director list fail because lack of the params`, function(done) {

    //   Request
    //   .get(COMMON_API)
    //   .set({
    //     Accept: 'application/json',
    //     Authorization: `Basic ${selfToken}`
    //   })
    //   .expect(400)
    //   .expect('Content-Type', /json/)
    //   .end(function(err, res) {
    //     if(err) return done(err)
    //     done()
    //   })

    // })

  })

  describe(`post new director fail test -> ${COMMON_API}`, function() {

    let name = COMMON_API.slice(23)

    it(`post new director fail because name is not verify`, function(done) {

      Request
      .post(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
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

    it(`post new director fail because lack of the name`, function(done) {

      Request
      .post(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
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

    it(`post new director fail because avatar is not verify`, function(done) {

      Request
      .post(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        name: name,
        alias: name,
        avatar: imageId.toString().slice(1),
        country: districtId.toString()
      })
      .expect(400)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        done()
      })

    })

    it(`post new director fail because lack of the avatar`, function(done) {

      Request
      .post(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        name: name,
        alias: name,
        country: districtId.toString()
      })
      .expect(400)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        done()
      })

    })

    it(`post new director fail because lack of the country`, function(done) {

      Request
      .post(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        name: name,
        alias: name,
        avatar: imageId.toString(),
      })
      .expect(400)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        done()
      })

    })

    it(`post new director fail because the country is not verify`, function(done) {

      Request
      .post(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        name: name,
        alias: name,
        avatar: imageId.toString(),
        country: districtId.toString().slice(1)
      })
      .expect(400)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        done()
      })

    })

    it(`post new director fail because not the auth`, async function() {

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
      .post(COMMON_API)
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

  describe(`put the director fail test -> ${COMMON_API}`, function() {

    let name = COMMON_API.slice(24)

    it(`put director fail because name is not verify`, function(done) {

      Request
      .put(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        _id: directorId.toString(),
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

    it(`put director fail because lack of the name`, function(done) {

      Request
      .put(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        _id: directorId.toString(),
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

    it(`put director fail because avatar is not verify`, function(done) {

      Request
      .put(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        name: name,
        alias: name,
        avatar: imageId.toString().slice(1),
        _id: directorId.toString(),
        country: districtId.toString()
      })
      .expect(400)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        done()
      })

    })

    it(`put director fail because lack of the avatar`, function(done) {

      Request
      .put(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        _id: directorId.toString(),
        name: name,
        alias: name,
        country: districtId.toString()
      })
      .expect(400)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        done()
      })

    })

    it(`put director fail because _id is not verify`, function(done) {

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
        _id: directorId.toString().slice(1),
        country: districtId.toString()
      })
      .expect(400)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        done()
      })

    })

    it(`put director fail because lack of the _id`, function(done) {

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

    it(`put director fail because not the auth`, async function() {

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
        _id: directorId.toString(),
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

    it(`put the director fail because lack of the count`, function(done) {

      Request
      .put(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        _id: directorId.toString(),
        name,
        alias: name,
        avatar: imageId.toString(),
      })
      .expect(400)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        done()
      })

    })

    it(`put the director fail because the country is not verify`, function(done) {

      Request
      .put(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        _id: directorId.toString(),
        name,
        alias: name,
        avatar: imageId.toString(),
        country: districtId.toString().slice(1)
      })
      .expect(400)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        done()
      })

    })

  })

  describe(`delete the director fail test -> ${COMMON_API}`, function() {

    let directorId

    before(function(done) {
      const { model } = mockCreateDirector({
        name: COMMON_API,
        source: anotherUserId,
        country: districtId
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
        directorId = data._id
        done()
      })
      .catch(err => {
        console.log('oops: ', err)
      })

    })
    
    it(`delete director fail because _id is not verify`, function(done) {

      Request
      .delete(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
        _id: directorId.toString().slice(1),
      })
      .expect(400)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        done()
      })

    })

    it(`delete director fail because lack of the _id`, function(done) {

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

    it(`delete director fail because not the auth`, async function() {

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
        _id: directorId.toString(),
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
