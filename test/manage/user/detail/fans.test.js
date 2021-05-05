require('module-alias/register')
const { UserModel, ImageModel } = require('@src/utils')
const { expect } = require('chai')
const { Request, commonValidate, mockCreateUser, mockCreateImage } = require('@test/utils')
const Day = require('dayjs')

const COMMON_API = '/api/manage/user/fans'

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
  let otherUserId
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
        avatar: imageId
      })
      const { model: otherUser } = mockCreateUser({
        username: COMMON_API,
        avatar: imageId
      })

      getToken = signToken

      return Promise.all([
        model.save(),
        otherUser.save()
      ])

    })
    .then(([data, otherUser]) => {
      userInfo = data
      otherUserId = otherUser._id
      selfToken = getToken(userInfo._id)
      return Promise.all([
        UserModel.updateOne({
          _id: userInfo._id
        }, {
          $set: {
            fans: [ otherUserId ]
          }
        }),
        UserModel.updateOne({
          _id: otherUserId
        }, {
          $set: {
            attentions: [ userInfo._id ]
          }
        }),
      ])      
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
        .query({
          _id: userInfo._id
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
          role: 'USER',
          _id: userInfo._id
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
          start_date: Day(Date.now() + 1000 * 24 * 60 * 60).format('YYYY-MM-DD'),
          _id: userInfo._id
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
          end_date: '1970-11-1',
          _id: userInfo._id
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
          content: '2019-11-1',
          _id: userInfo._id
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
          status: 'FREEZE',
          _id: userInfo._id
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

  })

})