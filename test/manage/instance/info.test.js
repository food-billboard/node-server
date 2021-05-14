require('module-alias/register')
const { GlobalModel, UserModel } = require('@src/utils')
const { expect } = require('chai')
const { Request, commonValidate, mockCreateUser, mockCreateGlobal } = require('@test/utils')

const COMMON_API = '/api/manage/instance/info'

function responseExpect(res, validate=[]) {
  const { res: { data: target } } = res
  expect(target).to.be.a('object').and.that.include.all.keys('list', 'total')
  commonValidate.number(target.total)
  expect(target.list).to.be.a('array')
  target.list.forEach(item => {
    expect(item).to.be.a('object').and.that.include.all.keys('notice', 'info', 'valid', '_id', 'visit_count', 'createdAt', 'updatedAt')
    commonValidate.string(item.notice)
    commonValidate.string(item.info)
    commonValidate.number(item.visit_count)
    commonValidate.objectId(item._id)
    commonValidate.time(item.createdAt)
    commonValidate.time(item.updatedAt)
    expect(item.valid).to.be.a('boolean')
  })

  if(Array.isArray(validate)) {
    validate.forEach(valid => {
      typeof valid == 'function' && valid(target)
    })
  }else if(typeof validate === 'function') {
    validate(target)
  }
}

const env = process.env.NODE_ENV

function envSet() {
  return new Promise((resolve) => {
    process.env.NODE_ENV = 'production'
    setTimeout(resolve, 300)
  }) 
}

function envUnSet() {
  return new Promise((resolve) => {
    process.env.NODE_ENV = env
    setTimeout(resolve, 300)
  })
}

describe(`${COMMON_API} test`, function() {

  let userInfo
  let selfToken
  let globalId

  before(function(done) {

    const { model: user, signToken } = mockCreateUser({
      username: COMMON_API
    })

    Promise.all([
      user.save(),
    ])
    .then(([user]) => {
      userInfo = user._id 
      selfToken = signToken(userInfo)
      const { model: global } = mockCreateGlobal({
        info: COMMON_API,
        notice: COMMON_API,
        origin: userInfo
      })
      return global.save()
    })
    .then(global => {
      globalId = global._id
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
      GlobalModel.deleteMany({
        $or: [
          {
            notice: COMMON_API
          },
          {
            info: COMMON_API
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

  describe(`${COMMON_API} get instance list test`, function() {
      
    describe(`${COMMON_API} get instance list success test`, function() {
      
      it(`get instance list success`, function(done) {

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
            done(err)
          }
          responseExpect(obj, target => {
            expect(target.list.length).to.not.be.equals(0)
          })
          done()
        })

      })

    })

  })

  describe(`${COMMON_API} post instance test`, function() {
      
    describe(`${COMMON_API} post instance success test`, function() {

      const infoNoValid = COMMON_API + 'no-valid'
      const infoHaveValid = COMMON_API + 'have-valid'

      after(function(done) {
        GlobalModel.find({
          info: { $in: [ infoNoValid, infoHaveValid ] }
        })
        .select({
          _id: 1,
          valid: 1,
          info: 1
        })
        .exec()
        .then(data => {
          expect(data).to.be.a('array')
          expect(data.length).to.be.eql(2)
          const target = data.find(item => item.info == infoHaveValid)
          expect(!!target).to.be.true
          expect(target.valid).to.be.true
          done()
        })
        .catch(err => {
          console.log('oops', err)
          done(err)
        })
      })
      
      it(`post instance success`, function(done) {
        Request
        .post(COMMON_API)
        .send({
          info: infoNoValid,
          notice: COMMON_API
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

      it(`post instance success and post the valueof true valid`, function(done) {
        Request
        .post(COMMON_API)
        .send({
          info: infoHaveValid,
          notice: COMMON_API,
          valid: true
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

    describe(`${COMMON_API} post instance fail test`, function() {
      
      it(`post the instance fail because the user not the auth`, function(done) {

        UserModel.updateOne({
          _id: userInfo
        }, {
          $set: {
            roles: ['SUB_DEVELOPMENT']
          }
        })
        .then(envSet)
        .then(_ => {
          return Request
          .post(COMMON_API)
          .send({
            info: COMMON_API,
            notice: COMMON_API,
          })
          .set({
            Accept: 'Application/json',
            Authorization: `Basic ${selfToken}`
          })
          .expect(403)
          .expect('Content-Type', /json/)
        })
        .then(_ => {
          return UserModel.updateOne({
            _id: userInfo
          }, {
            $set: {
              roles: ['SUPER_ADMIN']
            }
          })
        })
        .then(envUnSet)
        .then(_ => {
          done()
        })
        .catch(err => {
          console.log('oops: ', err)
          done(err)
        })
      })

      it(`post the instance fail becuase the params of info is not valid`, function(done) {
        Request
        .post(COMMON_API)
        .send({
          info: '',
          notice: COMMON_API,
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

      it(`post the instance fail becuase the params of notice is not valid`, function(done) {
        Request
        .post(COMMON_API)
        .send({
          info: COMMON_API,
          notice: '',
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

      it(`post the instance fail becuase the params of info is not found`, function(done) {
        Request
        .post(COMMON_API)
        .send({
          notice: COMMON_API,
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

      it(`post the instance fail becuase the params of notice is not found`, function(done) {
        Request
        .post(COMMON_API)
        .send({
          info: COMMON_API,
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

    })

  })

  describe(`${COMMON_API} put instance test`, function() {
      
    describe(`${COMMON_API} put instance success test`, function() {

      let newInfo = COMMON_API + 'new-info'

      after(function(done) {
        GlobalModel.findOne({
          info: newInfo
        })
        .select({
          _id: 1,
          info: 1
        })
        .exec()
        .then(data => {
          expect(!!data && !!data._doc).to.be.true
          expect(data._doc.info).to.be.equal(newInfo)
          done()
        })
        .catch(err => {
          console.log('oops: ', err)
          done(err)
        })
      })
      
      it(`put the instance success`, function(done) {
        Request
        .post(COMMON_API)
        .send({
          _id: globalId.toString(),
          info: newInfo,
          notice: COMMON_API
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

    describe(`${COMMON_API} put instance fail test`, function() {

      let newInfo = COMMON_API + 'new-info'
      
      it(`put the instance fail because the user not the auth`, function(done) {
        
        UserModel.updateOne({
          _id: userInfo
        }, {
          $set: {
            roles: ['SUB_DEVELOPMENT']
          }
        })
        .then(envSet)
        .then(_ => {
          return Request
          .put(COMMON_API)
          .send({
            _id: globalId.toString(),
            info: newInfo,
            notice: COMMON_API
          })
          .set({
            Accept: 'Application/json',
            Authorization: `Basic ${selfToken}`
          })
          .expect(403)
          .expect('Content-Type', /json/)
        })
        .then(_ => {
          return UserModel.updateOne({
            _id: userInfo
          }, {
            $set: {
              roles: ['SUPER_ADMIN']
            }
          })
        })
        .then(envUnSet)
        .then(_ => {
          done()
        })
        .catch(err => {
          console.log('oops: ', err)
          done(err)
        })

      })

      it(`put the instance fail because the id is not valid`, function(done) {
        Request
        .put(COMMON_API)
        .send({
          _id: globalId.toString().slice(1),
          info: newInfo,
          notice: COMMON_API
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

      it(`put the instance fail because the id is not found`, function(done) {
        const id = globalId.toString()
        Request
        .put(COMMON_API)
        .send({
          _id: `${Math.floor(10 / (+id[0] + 1))}${id.slice(1)}`,
          info: newInfo,
          notice: COMMON_API
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

      it(`put the instance fail because lack of the params of id`, function(done) {
        Request
        .put(COMMON_API)
        .send({
          info: newInfo,
          notice: COMMON_API
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

    })

  })

  describe(`${COMMON_API} delete instance test`, function() {
      
    describe(`${COMMON_API} delete instance success test`, function() {

      let globalId1
      let globalId2 
      before(function(done) {
        const { model: model1 } = mockCreateGlobal({
          notice: COMMON_API,
          info: COMMON_API + '1',
          origin: userInfo
        })
        const { model: model2 } = mockCreateGlobal({
          notice: COMMON_API,
          info: COMMON_API + '2',
          origin: userInfo
        })
        Promise.all([
          model1.save(),
          model2.save()
        ])
        .then(([global1, global2]) => {
          globalId1 = global1._id 
          globalId2 = global2._id
          done()
        })
        .catch(err => {
          console.log('oops: ', err)
          done(err)
        })
      })
      
      it(`delete the instance success`, function(done) {
        Request
        .delete(COMMON_API)
        .query({
          _id: `${globalId1.toString()}, ${globalId2.toString()}`
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

    describe(`${COMMON_API} delete instance fail test`, function() {

      let globalId 
      before(function(done) {
        const { model } = mockCreateGlobal({
          notice: COMMON_API,
          info: COMMON_API,
          origin: userInfo
        })
        model.save()
        .then(data => {
          globalId = data._id 
          done()
        })
        .catch(err => {
          console.log('oops: ', err)
          done(err)
        })
      })
      
      it(`delete the instance fail because the user not the auth`, function(done) {
        UserModel.updateOne({
          _id: userInfo
        }, {
          $set: {
            roles: ['SUB_DEVELOPMENT']
          }
        })
        .then(envSet)
        .then(_ => {
          return Request
          .delete(COMMON_API)
          .query({
            _id: globalId.toString()
          })
          .set({
            Accept: 'Application/json',
            Authorization: `Basic ${selfToken}`
          })
          .expect(403)
          .expect('Content-Type', /json/)
        })
        .then(_ => {
          return UserModel.updateOne({
            _id: userInfo
          }, {
            $set: {
              roles: ['SUPER_ADMIN']
            }
          })
        })
        .then(envUnSet)
        .then(_ => {
          done()
        })
        .catch(err => {
          console.log('oops: ', err)
          done(err)
        })
      })

      it(`delete the instance fail because the id is not found`, function(done) {
        const id = globalId.toString()
        Request
        .delete(COMMON_API)
        .query({
          _id: `${Math.floor(( +id[0] + 1 ) % 10)}${id.slice(1)}`
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

      it(`delete the instance fail because the id is not valid`, function(done) {
        Request
        .delete(COMMON_API)
        .query({
          _id: globalId.toString().slice(1)
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

      it(`delete the instance fail because lack of the params of id`, function(done) {
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

})