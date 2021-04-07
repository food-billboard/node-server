require('module-alias/register')
const { UserModel, ImageModel, FeedbackModel } = require('@src/utils')
const { expect } = require('chai')
const { Request, commonValidate, mockCreateUser, mockCreateImage, mockCreateFeedback } = require('@test/utils')
const Day = require('dayjs')

const COMMON_API = '/api/manage/user/detail/feedback'

function responseExpect(res, validate=[]) {
  const { res: { data: target } } = res

  expect(target).to.be.a('object').and.that.include.all.keys('total', 'list')
  commonValidate.number(target.total)
  expect(target.list).to.be.a('array')
  target.list.forEach(item => {
    expect(item).to.be.a('object').and.that.include.all.keys('_id', 'user_info', 'status', 'content')
    commonValidate.objectId(item._id)
    expect(item.user_info).to.be.a('object').and.that.include.all.keys('_id', 'username')
    commonValidate.objectId(item.user_info._id)
    commonValidate.string(item.user_info.username)
    commonValidate.string(item.status)
    expect(item.content).to.be.a('object').and.that.include.all.keys('text', 'image', 'video')
    commonValidate.string(item.content.text)
    expect(item.content.image).to.be.a('array')
    item.content.image.forEach(img => commonValidate.string(img))
    expect(item.content.video).to.be.a('array')
    item.content.video.forEach(vi => commonValidate.string(vi))
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
  let otherUserId
  let imageId
  let oneFeedId
  let twoFeedId
  let threeFeedId

  before(function(done) {

    const { model: user, signToken } = mockCreateUser({
      username: COMMON_API
    })
    const { model: other } = mockCreateUser({
      username: COMMON_API,
      roles: [ 'CUSTOMER' ]
    })
    const { model: image } = mockCreateImage({
      src: COMMON_API
    })

    Promise.all([
      user.save(),
      other.save(),
      image.save()
    ])
    .then(([user, other, image]) => {
      userInfo = user
      otherUserId = other._id
      imageId = image._id

      selfToken = signToken(userInfo._id)

      const { model: one } = mockCreateFeedback({
        content: {
          text: COMMON_API,
          image: [ imageId ],
          video: []
        },
        user_info: userInfo._id,
      })
      const { model: two } = mockCreateFeedback({
        content: {
          text: COMMON_API,
          image: [ imageId ],
          video: []
        },
        user_info: otherUserId,
      }) 
      const { model: three } = mockCreateFeedback({
        content: {
          text: COMMON_API,
          image: [ imageId ],
          video: []
        },
        user_info: otherUserId,
      }) 

      return Promise.all([
        one.save(),
        two.save(),
        three.save()
      ])

    })
    .then(([one, two, three]) => {

      oneFeedId = one._id
      twoFeedId = two._id
      threeFeedId = three._id

      done()

    })
    .catch(err => {
      console.log('oops: ', err)
    })

  })

  after(function(done) {

    Promise.all([
      UserModel.deleteMany({
        username: COMMON_API
      }),
      ImageModel.deleteMany({
        src: COMMON_API
      }),
      FeedbackModel.deleteMany({
        "content.text": COMMON_API
      })
    ])
    .then(data => {
      done()
    })
    .catch(err => {
      console.log('oops: ', err)
    })

  })

  describe(`${COMMON_API} success test`, function() {

    describe(`get the user feedback list success test -> ${COMMON_API}`, function() {

      it(`get the user feedback list success`, function(done) {

        Request
        .get(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .query({
          _id: otherUserId.toString(),
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

      it(`get the user feedback list with status`, function(done) {

        Request
        .get(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .query({
          _id: otherUserId.toString(),
          status:'DEAL'
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
            expect(target.list.length).to.be.equals(0)
          })
          done()
        })
  
      })
  
      it(`get the user feedback list with sort of start_date`, function(done) {
  
        Request
        .get(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .query({
          _id: otherUserId.toString(),
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
          responseExpect(obj, (target) => {
            const { list } = target
            expect(list.length).to.be.equals(0)
  
          })
          done()
        })
  
      })
  
      it(`get the user feedback list with sort of end_date`, function(done) {
  
        Request
        .get(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .query({
          _id: otherUserId.toString(),
          end_date: '1970-10-11'
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
            const { list } = target
            expect(list.length).to.be.equals(0)
  
          })
          done()
        })
  
      })

    })

    describe(`put the user feedback status success test -> ${COMMON_API}`, function() {

      after(function(done) {

        FeedbackModel.findOne({
          _id: oneFeedId,
          status: 'DEAL'
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

      it(`put the user feedback status success`, function(done) {

        Request
        .put(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .send({
          _id: oneFeedId.toString(),
          status: 'DEAL',
          description: COMMON_API
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if(err) return done(err)
          done()
        })

      })

    })

    describe(`delete the user feedback success test -> ${COMMON_API}`, function() {

      let feedbackIdA
      let feedbackIdB 
      
      before(function(done) {
        const { model: feedbackA } = mockCreateFeedback({
          content: {
            text: COMMON_API,
            image: [ imageId ],
            video: []
          },
          user_info: userInfo._id,
        })
        const { model: feedbackB } = mockCreateFeedback({
          content: {
            text: COMMON_API,
            image: [ imageId ],
            video: []
          },
          user_info: userInfo._id,
        })

        Promise.all([
          feedbackA.save(),
          feedbackB.save(),
        ])
        .then(([feedbackA, feedbackB]) => {
          feedbackIdA = feedbackA._id
          feedbackIdB = feedbackB._id
          done()
        })
        .catch(err => {
          console.log('oops: ', err)
          done(err)
        })
      })

      after(function(done) {

        FeedbackModel.find({
          _id: { $in: [ feedbackIdA, feedbackIdB ] }
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
          await FeedbackModel.deleteMany({ _id: { $in: [ feedbackIdA, feedbackIdB ] } })
          done(err)
        })

      })

      it(`delete the user feedback success`, function(done) {

        Request
        .delete(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .query({
          _id: `${feedbackIdA.toString()},${feedbackIdB.toString()}`
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

    describe(`get the user feedback list fail test -> ${COMMON_API}`, function() {

      it(`get the user feedback list fail because the id is not found`, function(done) {

        const id = otherUserId.toString()

        Request
        .get(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .query({
          _id: `${id.slice(1)}${Math.ceil(10 / (parseInt(id.slice(0, 1)) + 5))}`
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

      it(`get the user feedback list fail because the id is not verify`, function(done) {

        Request
        .get(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .query({
          _id: otherUserId.toString().slice(1)
        })
        .expect(400)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if(err) return done(err)
          done()
        })

      })

    })

    describe(`put the user feedback status fail test -> ${COMMON_API}`, function() {

      it(`put the user feedback status fail because the id is not verify`, function(done) {

        Request
        .put(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .send({
          _id: oneFeedId.toString().slice(1),
          description: COMMON_API
        })
        .expect(400)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if(err) return done(err)
          done()
        })

      })

      it(`put the user feedback status fail because the id is not found`, function(done) {

        const id = oneFeedId.toString()

        Request
        .put(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .send({
          _id: `${id.slice(1)}${Math.ceil(10 / (parseInt(id.slice(0, 1)) + 5))}`,
          description: COMMON_API
        })
        .expect(404)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if(err) return done(err)
          done()
        })

      })

      it(`put the user feedback status fail because lack the id`, function(done) {

        Request
        .put(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .send({
          description: COMMON_API
        })
        .expect(400)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if(err) return done(err)
          done()
        })

      })

      it(`put the user feedback status fail because the description is not verify`, function(done) {

        Request
        .put(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .send({
          _id: oneFeedId.toString(),
          description: ''
        })
        .expect(400)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if(err) return done(err)
          done()
        })

      })

      it(`put the user feedback status fail because lack the description`, function(done) {

        Request
        .put(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .send({
          _id: oneFeedId.toString(),
        })
        .expect(400)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if(err) return done(err)
          done()
        })

      })

    })

    describe(`delete the user feedback fail test -> ${COMMON_API}`, function() {

      it(`delete the user feedback fail because the id is not verify`, function(done) {

        Request
        .delete(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .query({
          _id: twoFeedId.toString().slice(1)
        })
        .expect(400)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if(err) return done(err)
          done()
        })

      })

      it(`delete the user feedback fail because the id is not found`, function(done) {

        const id = twoFeedId.toString()

        Request
        .delete(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .query({
          _id: `${id.slice(1)}${Math.ceil(10 / (parseInt(id.slice(0, 1)) + 5))}`,
        })
        .expect(404)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if(err) return done(err)
          done()
        })

      })

      it(`delete the user feedback fail because lack the id `, function(done) {

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

      it(`delete the user feedback fail because the user is not auth`, async function() {

        let res = true

        await UserModel.updateOne({
          _id: userInfo._id
        }, {
          $set: { roles: [ "ADMIN" ] }
        })
        .catch(err => {
          console.log('oops: ', err)
          res = false
        })

        await UserModel.updateOne({
          _id: otherUserId
        }, {
          $set: { roles: [ "SUPER_ADMIN" ] }
        })
        .catch(err => {
          console.log('oops: ', err)
          res = false
        })

        await Request
        .delete(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .query({
          _id: twoFeedId.toString()
        })
        .expect(403)
        .expect('Content-Type', /json/)

        await UserModel.updateOne({
          _id: userInfo._id
        }, {
          $set: { roles: [ 'SUPER_ADMIN' ] }
        })
        .catch(err => {
          console.log('oops: ', err)
          res = false
        })

        return res ? Promise.resolve() : Promise.reject()

      })

    })
    
  })

})