require('module-alias/register')
const { UserModel, ImageModel } = require('@src/utils')
const { expect } = require('chai')
const { Request, commonValidate, mockCreateUser, mockCreateImage, createMobile } = require('@test/utils')
const Day = require('dayjs')

const COMMON_API = '/api/manage/user'

function responseExpect(res, validate=[]) {
  const { res: { data: target } } = res

  expect(target).to.be.a('object').and.that.include.all.keys('total', 'list')
  commonValidate.number(target.total)
  expect(target.list).to.be.a('array')
  target.list.forEach(item => {
    expect(item).to.be.a('object').and.that.include.any.keys('_id', 'avatar', 'createdAt', 'updatedAt', 'username', 'mobile', 'email', 'hot', 'status', 'roles', 'fans_count', 'attentions_count', 'issue_count', 'comment_count', 'store_count')

    commonValidate.objectId(item._id)
    commonValidate.date(item.createdAt)
    commonValidate.date(item.updatedAt)
    commonValidate.string(item.username)
    commonValidate.number(item.mobile)
    commonValidate.string(item.email)
    commonValidate.number(item.hot)
    commonValidate.string(item.status)
    if(item.avatar) {
      commonValidate.poster(item.avatar)
    }
    expect(item.roles).to.be.a('array')
    item.roles.forEach(role => commonValidate.string(role))
    commonValidate.number(item.fans_count)
    commonValidate.number(item.attentions_count)
    commonValidate.number(item.issue_count)
    commonValidate.number(item.comment_count)
    commonValidate.number(item.store_count)
  })

  if(Array.isArray(validate)) {
    validate.forEach(valid => {
      typeof valid == 'function' && valid(target)
    })
  }else if(typeof validate === 'function') {
    validate(target)
  }
}

describe(`${COMMON_API} test`, function() {

  let userInfo 
  let selfToken
  let imageId
  let getToken

  before(function(done) {

    const { model } = mockCreateImage({
      src: COMMON_API
    })

    model.save()
    .then(data => {
      imageId = data._id

      const { model, signToken } = mockCreateUser({
        username: COMMON_API,
        // avatar: imageId
      })

      getToken = signToken

      return model.save()

    })
    .then(data => {
      userInfo = data
      selfToken = getToken(userInfo._id)
      done()
    })
    .catch(err => {
      console.log('oops: ', err)
    })

  })

  after(function(done) {

    Promise.all([
      UserModel.deleteMany({
        $or: [
          {
            username: COMMON_API
          },
          {
            username: COMMON_API.slice(10)
          }
        ]
      }),
      ImageModel.deleteMany({
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

  describe(`${COMMON_API} success test`, function() {

    describe(`get user list success -> ${COMMON_API}`, function() {

      it(`get user list success`, function(done) {

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
            expect(target.list.length).to.not.be.equals(0)
          })
          done()
        })

      })

      it(`get user list success with roles`, function(done) {

        Request
        .get(COMMON_API)
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .query({
          roles: 'USER'
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
            expect(target.list.some(item => userInfo._id.equals(item._id))).to.be.false
          })
          done()
        })

      })

      it(`get user list success with start_date`, function(done) {
        
        Request
        .get(COMMON_API)
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .query({
          start_date: Day(Date.now() + 1000 * 24 * 60 * 60).format('YYYY-MM-DD')
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
            expect(target.list.length).to.be.equals(0)
          })
          done()
        })

      })

      it(`get user list success with end_date`, function(done) {
        
        Request
        .get(COMMON_API)
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .query({
          end_date: '1970-11-1'
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
            expect(target.list.length).to.be.equals(0)
          })
          done()
        })

      })

      it(`get user list success with content`, function(done) {
        
        Request
        .get(COMMON_API)
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .query({
          content: '2019-11-1'
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
            expect(target.list.length).to.be.equals(0)
          })
          done()
        })

      })

      it(`get user list success with status`, function(done) {
        
        Request
        .get(COMMON_API)
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .query({
          status: 'FREEZE'
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
            expect(target.list.length).to.be.equals(0)
          })
          done()
        })

      })

    })

    describe(`post the user success test -> ${COMMON_API}`, function() {

      after(function(done) {

        UserModel.deleteOne({
          username: COMMON_API.slice(1),
          roles: ["USER", 'CUSTOMER']
        })
        .then(_ => {
          done()
        })
        .catch(err => {
          console.log('oops: ', err)
          done(err)
        })

      })

      it(`post the user success`, function(done) {

        const mobile = createMobile()

        Request
        .post(COMMON_API)
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .send({
          mobile: mobile,
          password: 'shenjing8',
          email: `${mobile}@163.com`,
          username: COMMON_API.slice(1),
          description: COMMON_API,
          avatar: imageId.toString(),
          roles: 'USER,CUSTOMER'
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if(err) return done(err)
          done()
        })

      })

    })

    describe(`put the user success test -> ${COMMON_API}`, function() {

      let userInfo

      before(function(done) {

        const { model } = mockCreateUser({
          username: COMMON_API.slice(1),
          roles: [ 'CUSTOMER' ]
        })

        model.save()
        .then(data => {
          userInfo = data
          done()
        })
        .catch(err => {
          console.log('oops: ', err)
        })

      })

      after(function(done) {

        UserModel.findOne({
          _id: userInfo._id,
          username: COMMON_API.slice(2),
          roles: ["USER", "CUSTOMER"]
        })
        .select({
          _id: 1,
        })
        .exec()
        .then(data => {
          expect(!!data).to.be.true
          return UserModel.deleteOne({
            username: COMMON_API.slice(2)
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

      it(`put the user succcess`, function(done) {

        const info = {
          _id: userInfo._id,
          mobile: userInfo.mobile,
          password: 'shenjing8',
          email: userInfo.email,
          username: COMMON_API.slice(2),
          description: userInfo.description,
          avatar: imageId.toString(),
          roles: 'USER,CUSTOMER'
        }

        Request
        .put(COMMON_API)
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .send(info)
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if(err) return done(err)
          done()
        })

      })

    })

    describe(`delete the user success test -> ${COMMON_API}`, function() {

      let userIdA
      let userIdB

      before(function(done) {

        const { model: userA } = mockCreateUser({
          username: COMMON_API.slice(1),
          roles: [ 'CUSTOMER' ]
        })
        const { model: userB } = mockCreateUser({
          username: COMMON_API.slice(2),
          roles: [ 'CUSTOMER' ]
        })

        Promise.all([
          userA.save(),
          userB.save()
        ])
        .then(([ userA, userB ]) => {
          userIdA = userA._id
          userIdB = userB._id
          done()
        })
        .catch(err => {
          console.log('oops: ', err)
        })

      })

      after(function(done) {

        UserModel.find({
          _id: { $in: [ userIdA, userIdB ] },
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
          await UserModel.deleteMany({ _id: { $in: [ userIdA, userIdB ] } })
          done(err)
        })

      })

      it(`delete the user success`, function(done) {

        Request
        .delete(COMMON_API)
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .query({
          _id: `${userIdA.toString()},${userIdB.toString()}`
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if(err) return done(err)
          done()
        })

      })

    })

  })

  describe(`${COMMON_API} fail test`, function() {
    
    // describe(`get usr list fail -> ${COMMON_API}`, function() {

    //   it(`get user list fail`, function() {

    //   })

    // })

    describe(`check the edit user info is correct`, function() {

      const userInfo = {
        mobile: 13111111111,
        password: 'shenjing8',
        email: '13111111111@163.com',
        username: COMMON_API.slice(1),
        description: COMMON_API,
        avatar: '571094e2976aeb1df982ad4e',
        roles: 'USER'
      }

      it(`check the edit user info fail because mobile is not verify`, function(done) {

        Request
        .post(COMMON_API)
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .send({
          ...userInfo,
          mobile: 1
        })
        .expect(400)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if(err) return done(err)
          done()
        })

      })

      it(`check the edit user info fail because lack the params of mobile`, function(done) {

        const { mobile, ...nextUserInfo } = userInfo
        
        Request
        .post(COMMON_API)
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .send(nextUserInfo)
        .expect(400)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if(err) return done(err)
          done()
        })

      })

      it(`check the edit user info fail because password is not verify`, function(done) {

        Request
        .post(COMMON_API)
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .send({
          ...userInfo,
          password: ''
        })
        .expect(400)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if(err) return done(err)
          done()
        })

      })

      it(`check the edit user info fail because lack the params of password`, function(done) {
        
        const { password, ...nextUserInfo } = userInfo
        
        Request
        .post(COMMON_API)
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .send(nextUserInfo)
        .expect(400)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if(err) return done(err)
          done()
        })

      })

      it(`check the edit user info fail because email is not verify`, function(done) {

        Request
        .post(COMMON_API)
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .send({
          ...userInfo,
          email: ''
        })
        .expect(400)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if(err) return done(err)
          done()
        })

      })

      it(`check the edit user info fail because lack the params of email`, function(done) {
        
        const { email, ...nextUserInfo } = userInfo
        
        Request
        .post(COMMON_API)
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .send(nextUserInfo)
        .expect(400)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if(err) return done(err)
          done()
        })

      })

      it(`check the edit user info fail because username is not verify`, function(done) {

        Request
        .post(COMMON_API)
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .send({
          ...userInfo,
          username: ''
        })
        .expect(400)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if(err) return done(err)
          done()
        })

      })

      it(`check the edit user info fail because lack the params of username`, function(done) {
        
        const { username, ...nextUserInfo } = userInfo
        
        Request
        .post(COMMON_API)
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .send(nextUserInfo)
        .expect(400)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if(err) return done(err)
          done()
        })

      })

      it(`check the edit user info fail because description is not verify`, function(done) {

        Request
        .post(COMMON_API)
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .send({
          ...userInfo,
          description: ''
        })
        .expect(400)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if(err) return done(err)
          done()
        })

      })

      it(`check the edit user info fail because lack the params of description`, function(done) {
        
        const { description, ...nextUserInfo } = userInfo
        
        Request
        .post(COMMON_API)
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .send(nextUserInfo)
        .expect(400)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if(err) return done(err)
          done()
        })

      })

      it(`check the edit user info fail because avatar is not verify`, function(done) {

        Request
        .post(COMMON_API)
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .send({
          ...userInfo,
          avatar: ''
        })
        .expect(400)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if(err) return done(err)
          done()
        })

      })

      it(`check the edit user info fail because lack the params of avatar`, function(done) {
        
        const { avatar, ...nextUserInfo } = userInfo
        
        Request
        .post(COMMON_API)
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .send(nextUserInfo)
        .expect(400)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if(err) return done(err)
          done()
        })

      })

      it(`check the edit user info fail because role is not verify`, function(done) {

        Request
        .post(COMMON_API)
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .send({
          ...userInfo,
          roles: ''
        })
        .expect(400)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if(err) return done(err)
          done()
        })

      })

      it(`check the edit user info fail because lack the params of role`, function(done) {
        
        const { role, ...nextUserInfo } = userInfo
        
        Request
        .post(COMMON_API)
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .send(nextUserInfo)
        .expect(400)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if(err) return done(err)
          done()
        })

      })

    })

    describe(`post the user fail test -> ${COMMON_API}`, function() {

      const otherUserInfo = {
        mobile: 13111111111,
        password: 'shenjing8',
        email: '13111111111@163.com',
        username: COMMON_API.slice(1),
        description: COMMON_API,
        avatar: '571094e2976aeb1df982ad4e',
        roles: 'SUPER_ADMIN'
      }

      it(`post the user fail because the user is not the auth`, function(done) {

        UserModel.updateOne({
          _id: userInfo._id 
        }, {
          $set: {
            roles: [ "ADMIN" ]
          }
        })
        .then(_ => {
          return Request
          .post(COMMON_API)
          .set({
            Accept: 'Application/json',
            Authorization: `Basic ${selfToken}`
          })
          .send(otherUserInfo)
          .expect(403)
          .expect('Content-Type', /json/)
        })
        .then(_ => {
          return UserModel.updateOne({
            _id: userInfo._id 
          }, {
            $set: {
              roles: [ "SUPER_ADMIN" ]
            }
          })
        })
        .then(_ => {
          done()
        })
        .catch(err => {
          done(err)
        })

      })

      // it(`post the user fail because the new user is exists already`, function(done) {

      //   Request
      //   .post(COMMON_API)
      //   .set({
      //     Accept: 'Application/json',
      //     Authorization: `Basic ${selfToken}`
      //   })
      //   .send({
      //     ...otherUserInfo,
      //     mobile: userInfo.mobile
      //   })
      //   .expect(403)
      //   .expect('Content-Type', /json/)
      //   .end(function(err, res) {
      //     if(err) return done(err)
      //     done()
      //   })

      // })

    })

    describe(`put the user fail test -> ${COMMON_API}`, function() {

      let toPutUserInfo
      let send

      before(function(done) {

        const { model } = mockCreateUser({
          username: COMMON_API.slice(1),
        })

        model.save()
        .then(data => {
          toPutUserInfo = data
          send = {
            _id: toPutUserInfo._id,
            mobile: toPutUserInfo.mobile,
            password: 'shenjing8',
            email: toPutUserInfo.email,
            username: toPutUserInfo.username,
            description: toPutUserInfo.description,
            avatar: toPutUserInfo.avatar,
            roles: 'USER'
          }
          done()
        })
        .catch(err => {
          console.log('oops: ', err)
        })

      })

      after(function(done) {

        UserModel.deleteOne({
          username: COMMON_API.slice(1)
        })
        .then(_ => {
          done()
        })
        .catch(err => {
          console.log('oops: ', err)
        })

      })

      it(`put the user fail because the user is not the auth`, async function() {

        let res = true

        await UserModel.updateOne({
          _id: userInfo._id
        }, {
          $set: {
            roles: [ "ADMIN" ]
          }
        })
        
        Request
        .put(COMMON_API)
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .send({
          ...send,
          roles: 'SUPER_ADMIN'
        })
        .expect(403)
        .expect('Content-Type', /json/)
        
        await UserModel.updateOne({
          _id: userInfo._id
        }, {
          $set: {
            roles: [ "SUPER_ADMIN" ]
          }
        })

        await UserModel.updateOne({
          _id: toPutUserInfo._id
        }, {
          $set: {
            roles: [ 'CUSTOMER' ]
          }
        })
        .catch(err => {
          console.log('oops: ', err)
          res = false
        })

        return res ? Promise.resolve() : Promise.reject(COMMON_API)

      })

      it(`put the user fail because the user id is is not verify`, function(done) {

        Request
        .put(COMMON_API)
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .send({
          ...send,
          _id: '1'
        })
        .expect(400)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if(err) return done(err)
          done()
        })

      })

      it(`put the user fail because the user id is is not found`, function(done) {

        const id = send._id.toString()
        
        Request
        .put(COMMON_API)
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .send({
          ...send,
          _id: `${id.slice(1)}${Math.floor(10 / (parseInt(id.slice(0, 1)) + 5))}`
        })
        .expect(404)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if(err) return done(err)
          done()
        })

      })

    })

    describe(`delete the user fail test -> ${COMMON_API}`, function() {

      let toDeleteUserInfo

      before(function(done) {

        const { model } = mockCreateUser({
          username: COMMON_API.slice(1),
        })

        model.save()
        .then(data => {
          toDeleteUserInfo = data
          done()
        })
        .catch(err => {
          console.log('oops: ', err)
        })

      })

      after(function(done) {

        UserModel.deleteOne({
          username: COMMON_API.slice(1)
        })
        .then(_ => {
          done()
        })
        .catch(err => {
          console.log('oops: ', err)
        })

      })

      it(`delete the user fail because the user is not the auth`, function(done) {

        UserModel.updateOne({
          _id: userInfo._id 
        }, {
          roles: [ 'ADMIN' ]
        })
        .then(_ => {
          return Request
          .delete(COMMON_API)
          .set({
            Accept: 'Application/json',
            Authorization: `Basic ${selfToken}`
          })
          .query({
            _id: toDeleteUserInfo._id.toString()
          })
          .expect(403)
          .expect('Content-Type', /json/)
        })
        .then(_ => {
          return UserModel.updateOne({
            _id: userInfo._id 
          }, {
            roles: [ 'SUPER_ADMIN' ]
          })
        })
        .then(_ => {
          done()
        })
        .catch(err => {
          done(err)
        })

      })

      it(`delete the user fail because the user id is is not verify`, function(done) {

        Request
        .delete(COMMON_API)
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .query({
          _id: toDeleteUserInfo._id.toString().slice(1)
        })
        .expect(400)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if(err) return done(err)
          done()
        })

      })

      it(`delete the user fail because the user id is is not found`, async function() {
        
        let res = true

        const id = toDeleteUserInfo._id.toString()

        await UserModel.updateOne({
          _id: toDeleteUserInfo._id
        }, {
          $set: { roles: [ 'CUSTOMER' ] }
        })
        .catch(err => {
          console.log('oops: ', err)
          res = false
        })

        await Request
        .delete(COMMON_API)
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .query({
          _id: `${id.slice(1)}${Math.floor(10 / (parseInt(id.slice(0, 1)) + 5))}`
        })
        .expect(404)
        .expect('Content-Type', /json/)

        return res ? Promise.resolve() : Promise.reject(COMMON_API)

      })

    })

  })

})