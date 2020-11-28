require('module-alias/register')
const { UserModel, FeedbackModel, MovieModel, GlobalModel, BehaviourModel } = require('@src/utils')
const { expect } = require('chai')
const { Request, commonValidate, mockCreateBehaviour, mockCreateUser, mockCreateFeedback, mockCreateMovie, mockCreateGlobal } = require('@test/utils')
const { Types: { ObjectId } } = require("mongoose")

const COMMON_API = '/api/manage/dashboard/nav'

function responseExpect(res, validate=[]) {
  const { res: { data: target } } = res

  expect(target).to.be.a('object').and.that.include.all.keys('user_count', 'visit_day', 'data_count', 'feedback_count')
  const { user_count, visit_day, data_count, feedback_count } = target
  expect(user_count).to.be.a('object').and.that.include.all.keys('total', 'week_add', 'day_add', 'day_add_count')
  commonValidate.number(parseInt(user_count.total))
  commonValidate.number(parseInt(user_count.week_add))
  commonValidate.number(parseInt(user_count.day_add))
  commonValidate.number(parseInt(user_count.day_add_count))
  expect(visit_day).to.be.a('object').and.that.include.all.keys('data', 'total')
  commonValidate.number(visit_day.total)
  expect(visit_day.data).to.be.a('array')
  visit_day.data.forEach(item => {
    expect(item).to.be.a('object').and.that.include.all.keys('day', 'count')
    commonValidate.string(item.day)
    commonValidate.number(item.count)
  })
  expect(data_count).to.be.a('object').and.that.include.all.keys('total', 'week_add', 'day_add', 'day_count', 'data')
  commonValidate.number(parseInt(data_count.total))
  commonValidate.number(parseInt(data_count.week_add))
  commonValidate.number(parseInt(data_count.day_add))
  commonValidate.number(data_count.day_count)
  expect(data_count.data).to.be.a('array')
  data_count.data.forEach(item => {
    expect(item).to.be.a('object').and.that.include.all.keys('day', 'count')
    commonValidate.string(item.day)
    commonValidate.number(item.count)
  })
  expect(feedback_count).to.be.a('object').and.that.include.all.keys('total', 'week_add', 'day_add', 'day_add_count', 'transform_count')
  commonValidate.number(feedback_count.total)
  commonValidate.number(feedback_count.week_add)
  commonValidate.number(feedback_count.day_add)
  commonValidate.number(feedback_count.day_add_count)
  commonValidate.number(feedback_count.transform_count)

  if(Array.isArray(validate)) {
    validate.forEach(valid => {
      typeof valid == 'function' && valid(target)
    })
  }else if(typeof validate === 'function') {
    validate(target)
  }
}

describe(`${COMMON_API} test`, function() {

  let selfToken

  before(function(done) {

    const { model:behaviourA } = mockCreateBehaviour({
      user: ObjectId('8f63270f005f1c1a0d9448ca')
    })
    const { model:behaviourB } = mockCreateBehaviour({
      user: ObjectId('8f63270f005f1c1a0d9448ca')
    })
    const { model: userA, signToken } = mockCreateUser({
      username: COMMON_API
    })
    const { model: userB } = mockCreateUser({
      username: COMMON_API
    })
    const { model:feedA } = mockCreateFeedback({
      content: {
        text: COMMON_API
      }
    })
    const { model:feedB } = mockCreateFeedback({
      content: {
        text: COMMON_API
      }
    })
    const { model:movieA } = mockCreateMovie({
      name: COMMON_API,
      description: COMMON_API
    })
    const { model:movieB } = mockCreateMovie({
      name: COMMON_API.slice(1),
      description: COMMON_API
    })
    const { model: globalA } = mockCreateGlobal({
      notice: COMMON_API
    })
    const { model: globalB } = mockCreateGlobal({
      notice: COMMON_API
    })

    Promise.all([
      behaviourA.save(),
      behaviourB.save(),
      userA.save(),
      userB.save(),
      feedA.save(),
      feedB.save(),
      movieA.save(),
      movieB.save(),
      globalA.save(),
      globalB.save(),
    ])
    .then(([,,userInfo]) => {
      selfToken = signToken(userInfo._id)
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
      FeedbackModel.deleteMany({
        "content.text": COMMON_API
      }),
      MovieModel.deleteMany({
        description: COMMON_API
      }),
      GlobalModel.deleteMany({
        notice: COMMON_API
      }),
      BehaviourModel.deleteMany({
        user: ObjectId('8f63270f005f1c1a0d9448ca')
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

    it(`get the nav card list success`, function(done) {
    
      Request
      .get(COMMON_API)
      .set({
        Accept: 'application/json',
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
          expect(target.visit_day.data.length).to.not.be.equals(0)
          expect(target.data_count.data.length).to.not.be.equals(0)
        })
        done()
      })

    })

  })

  // describe(`${COMMON_API} fail test`, function() {
    
  // })

})