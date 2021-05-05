require('module-alias/register')
const { MovieModel, UserModel } = require('@src/utils')
const { expect } = require('chai')
const { Request, commonValidate, mockCreateUser, mockCreateMovie } = require('@test/utils')

const COMMON_API = '/api/manage/admin/upload'

function responseExpect(res, validate=[]) {
  const { res: { data: target } } = res

  expect(target).to.be.a('object').and.that.include.all.keys('total', 'list')
  commonValidate.number(target.total)
  expect(target.list).to.be.a('array')
  target.list.forEach(item => {
    expect(item).to.be.a('object').and.that.include.all.keys('_id', 'name', 'glance', 'hot', 'rate_person', 'total_rate', 'createdAt', 'updatedAt', 'status', 'barrage_count', 'tag_count', 'comment_count', 'description', 'poster', 'images')
    commonValidate.objectId(item._id)
    commonValidate.string(item.name)
    commonValidate.number(item.hot)
    commonValidate.number(item.rate_person)
    commonValidate.number(item.total_rate)
    commonValidate.date(item.createdAt)
    commonValidate.date(item.updatedAt)
    commonValidate.string(item.status)
    commonValidate.number(item.barrage_count)
    commonValidate.number(item.tag_count)
    commonValidate.number(item.comment_count)
    commonValidate.string(item.description)
    if(item.poster) {
      commonValidate.string(item.poster)
    }
    expect(item.images).to.be.a('array')
    item.images.forEach(item => commonValidate.string(item))
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

  before(function(done) {

    const { model, signToken } = mockCreateUser({
      username: COMMON_API
    })

    model.save()
    .then(data => {
      userInfo = data
      selfToken = signToken(userInfo._id)
      const { model } = mockCreateMovie({
        name: COMMON_API,
        author: userInfo._id
      })

      return model.save()

    })
    .then(data => {

      return UserModel.updateOne({
        _id: userInfo._id
      }, {
        $push: { issue: { _id: data._id, timestamps: Date.now() } }
      })
    })
    .then(data => {
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
      MovieModel.deleteMany({
        name: COMMON_API
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

    it(`get the admin issue list success`, function(done) {
      
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
          expect(target.list.length).to.not.be.equals(0)
        })
        done()
      })

    })

  })

  // describe(`${COMMON_API} fail test`, function() {
    
  // })

})