require('module-alias/register')
const { UserModel, ClassifyModel, ImageModel, DistrictModel } = require('@src/utils')
const { expect } = require('chai')
const { Request, commonValidate, mockCreateUser, mockCreateClassify, mockCreateImage, mockCreateDistrict } = require('@test/utils')

const COMMON_API = '/api/manage/movie/detail/info/classify'

function responseExpect(res, validate=[]) {
  const { res: { data: target } } = res

  expect(target).to.be.a('object').and.that.includes.all.keys('total', 'list')

  target.list.forEach(item => {
    expect(item).to.be.a('object').that.includes.any.keys('key', '_id', 'name', 'createdAt', 'updatedAt', 'icon', 'source_type', 'glance')
    commonValidate.objectId(item._id)
    commonValidate.number(item.glance)
    if(item.key) {
      commonValidate.string(item.key)
    }
    commonValidate.string(item.name)
    if(item.icon) {
      commonValidate.poster(item.icon)
    }
    commonValidate.string(item.source_type)
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
  let anotherUserId
  let selfToken
  let imageId
  let classifyId
  let getToken
  let districtId

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

      const { model: other } = mockCreateUser({
        username: COMMON_API,
      })

      const { model: district } = mockCreateDistrict({
        name: COMMON_API,
      })

      getToken = signToken

      return Promise.all([
        user.save(),
        other.save(),
        district.save()
      ])

    })
    .then(([user, other, district]) => {
      userInfo = user
      anotherUserId = other._id
      selfToken = getToken(userInfo._id)
      districtId = district._id
      const { model } = mockCreateClassify({
        name: COMMON_API,
        icon: imageId,
        source: userInfo._id
      })

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
      ClassifyModel.deleteMany({
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
  
  describe(`get the classify list success test -> ${COMMON_API}`, function() {

    it(`get the classify success with id`, function(done) {

      Request
      .get(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
        _id: classifyId.toString(),
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

    it(`get the classify success with content`, function(done) {

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
          expect(target.list.length).to.be.not.equals(0)
        })
        done()
      })

    })

    it(`get the classify success and with all`, function(done) {
      const { model } = mockCreateClassify({
        name: COMMON_API,
        icon: imageId,
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
      .catch(err => {
        console.log('oops: ', err)
      })

    })

  })

  describe(`post new classify success test -> ${COMMON_API}`, function() {

    let name = COMMON_API.slice(20)

    after(function(done) {

      ClassifyModel.findOne({
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

    it(`post new classify success`, function(done) {

      Request
      .post(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        name,
        icon: imageId.toString()
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        done()
      })

    })

  })

  describe(`put the classify success test -> ${COMMON_API}`, function() {

    let name = COMMON_API.slice(21)

    after(function(done) {

      ClassifyModel.findOne({
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

    it(`put the classify success`, function(done) {

      Request
      .put(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        _id: classifyId.toString(),
        name,
        icon: imageId.toString()
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        done()
      })

    })

  })

  describe(`delete the classify success test -> ${COMMON_API}`, function() {

    let classifyIdA
    let classifyIdB

    before(function(done) {

      const { model: classifyA } = mockCreateClassify({
        name: COMMON_API.slice(22),
        source: anotherUserId,
        country: districtId,
      })

      const { model: classifyB } = mockCreateClassify({
        name: COMMON_API.slice(23),
        source: anotherUserId,
        country: districtId,
      })

      Promise.all([
        classifyA.save(),
        classifyB.save(),
        UserModel.updateOne({
          _id: anotherUserId
        }, {
          $set: { roles: [ 'CUSTOMER' ] }
        })
      ])
      .then(([classifyA, classifyB]) => {
        classifyIdA = classifyA._id
        classifyIdB = classifyB._id
        done()
      })
      .catch(err => {
        console.log('oops: ', err)
      })

    })

    after(function(done) {

      ClassifyModel.find({
        _id: { $in: [classifyIdA, classifyIdB] }
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
        await ClassifyModel.deleteMany({ _id: { $in: [ classifyIdA, classifyIdB ] } })
        done(err)
      })

    })

    it(`delete the classify success`, function(done) {

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

  describe(`get the classify list fail test -> ${COMMON_API}`, function() {

    // it(`get the classify list fail because lack of the params`, function(done) {

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

  describe(`post new classify fail test -> ${COMMON_API}`, function() {

    let name = COMMON_API.slice(23)

    it(`post new classify fail because name is not verify`, function(done) {

      Request
      .post(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        name: name.repeat(5),
        icon: imageId.toString()
      })
      .expect(400)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        done()
      })

    })

    it(`post new classify fail because lack of the name`, function(done) {

      Request
      .post(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        icon: imageId.toString()
      })
      .expect(400)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        done()
      })

    })

    it(`post new classify fail because icon is not verify`, function(done) {

      Request
      .post(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        name: name,
        icon: imageId.toString().slice(1)
      })
      .expect(400)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        done()
      })

    })

    it(`post new classify fail because lack of the icon`, function(done) {

      Request
      .post(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        name: name,
      })
      .expect(400)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        done()
      })

    })

    it(`post new classify fail because not the auth`, async function() {

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
        icon: imageId.toString()
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

  describe(`put the classify fail test -> ${COMMON_API}`, function() {

    let name = COMMON_API.slice(24)

    it(`put classify fail because name is not verify`, function(done) {

      Request
      .put(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        _id: classifyId.toString(),
        name: name.repeat(5),
        icon: imageId.toString()
      })
      .expect(400)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        done()
      })

    })

    it(`put classify fail because lack of the name`, function(done) {

      Request
      .put(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        _id: classifyId.toString(),
        icon: imageId.toString()
      })
      .expect(400)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        done()
      })

    })

    it(`put classify fail because icon is not verify`, function(done) {

      Request
      .put(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        name: name,
        icon: imageId.toString().slice(1),
        _id: classifyId.toString(),
      })
      .expect(400)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        done()
      })

    })

    it(`put classify fail because lack of the icon`, function(done) {

      Request
      .put(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        _id: classifyId.toString(),
        name: name,
      })
      .expect(400)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        done()
      })

    })

    it(`put classify fail because _id is not verify`, function(done) {

      Request
      .put(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        name: name,
        icon: imageId.toString(),
        _id: classifyId.toString().slice(1),
      })
      .expect(400)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        done()
      })

    })

    it(`put classify fail because lack of the _id`, function(done) {

      Request
      .put(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        name: name,
        icon: imageId.toString()
      })
      .expect(404)
      .expect('Content-Type', /json/)
      .end(function(err, res) {
        if(err) return done(err)
        done()
      })

    })

    it(`put classify fail because not the auth`, async function() {

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
        _id: classifyId.toString(),
        name: name,
        icon: imageId.toString()
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

  describe(`delete the classify fail test -> ${COMMON_API}`, function() {

    let classifyId

    before(function(done) {
      const { model } = mockCreateClassify({
        name: COMMON_API,
        source: anotherUserId
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
        classifyId = data._id
        done()
      })
      .catch(err => {
        console.log('oops: ', err)
      })

    })
    
    it(`delete classify fail because _id is not verify`, function(done) {

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

    it(`delete classify fail because lack of the _id`, function(done) {

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

    it(`delete classify fail because not the auth`, async function() {

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
        _id: classifyId.toString(),
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
