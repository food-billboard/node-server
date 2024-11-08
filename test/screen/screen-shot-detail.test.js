require('module-alias/register')
const { 
  UserModel, 
  ScreenShotModel,
  ScreenModal
} = require('@src/utils')
const { expect } = require('chai')
const { 
  Request, 
  commonValidate, 
  mockCreateUser, 
  mockCreateScreenShot,
  mockCreateScreen
} = require('@test/utils')

const COMMON_API = '/api/screen/shot/detail'

function responseExpect(res, validate=[]) {
  const { res: { data: target } } = res

  expect(target).to.be.a("object").and.that.includes.any.keys('_id', 'name', 'description', 'poster', 'components', 'version')
  commonValidate.objectId(target._id)
  commonValidate.string(target.name)
  commonValidate.string(target.description)
  commonValidate.string(target.version)
  commonValidate.poster(target.poster)
  expect(target.components).to.be.a('object')

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
  let shotId
  let screenId
  let getToken

  before(function(done) {

    const { model, signToken } = mockCreateUser({
      username: COMMON_API,
    })

    getToken = signToken

    model.save()
    .then((user) => {
      userInfo = user 
      selfToken = getToken(userInfo._id)
      const { model } = mockCreateScreen({
        user: userInfo._id,
        name: COMMON_API
      })
      return model.save()
    })
    .then(screen => {
      screenId = screen._id 
      const { model: shot } = mockCreateScreenShot({
        screen: screenId,
        user: userInfo._id,
        description: COMMON_API,
        data: JSON.stringify({
          _id: screenId.toString(),
          data: JSON.stringify({ a: 1 }),
          name: COMMON_API,
          poster: COMMON_API,
          description: COMMON_API,
          version: '1.22'
        })
      })
      return shot.save()
    })
    .then((shot) => {
      shotId = shot._id 
      return ScreenModal.updateOne({
        _id: screenId 
      }, {
        $set: {
          screen_shot: shotId
        }
      })
    })
    .then(() => {
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
      ScreenShotModel.deleteMany({
        user: userInfo._id
      }),
      ScreenModal.deleteMany({
        user: userInfo._id
      })
    ])
    .then(_ => {
      done()
    })
    .catch(err => {
      console.log('oops: ', err)
    })

  })
  
  describe(`get the screen shot use success test -> ${COMMON_API}`, function() {

    it(`get the screen shot use success`, function(done) {

      Request
      .get(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
        _id: screenId.toString()
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
        responseExpect(obj)
        done()
      })

    })

  })

  describe(`get the screen shot list fail test -> ${COMMON_API}`, function() {

    it(`get the screen shot list fail because lack of the params`, function(done) {

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

})
