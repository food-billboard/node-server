require('module-alias/register')
const { CommentModel, UserModel, ImageModel } = require('@src/utils')
const { expect } = require('chai')
const { Request, commonValidate, mockCreateUser, mockCreateComment, mockCreateImage } = require('@test/utils')

const COMMON_API = '/api/manage/admin/comment'

function responseExpect(res, validate=[]) {
  const { res: { data: target } } = res

  expect(target).to.be.a('object').and.that.include.all.keys('total', 'list')
  commonValidate.number(target.total)
  expect(target.list).to.be.a('array')
  target.list.forEach(item => {
    expect(item).to.be.a('object').and.that.include.all.keys('_id', 'source_type', 'source', 'sub_comments', 'total_like', 'content', 'createdAt', 'updatedAt')
    commonValidate.objectId(item._id)
    commonValidate.string(item.source_type)
    commonValidate.number(item.sub_comments)
    commonValidate.number(item.total_like)
    expect(item.content).to.be.a('object').and.that.include.all.keys('text', 'image', 'video')
    commonValidate.string(item.content.text)
    console.log(item.content.image)
    expect(item.content.image).to.be.a('array')
    item.content.image.forEach(img => commonValidate.string(img))
    expect(item.content.video).to.be.a('array')
    item.content.video.forEach(vi => commonValidate.string(vi))
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

describe(`${COMMON_API} test`, function() {

  let userInfo
  let selfToken

  before(function(done) {

    const { model, signToken } = mockCreateUser({
      username: COMMON_API
    })
    const { model: image } = mockCreateImage({
      src: COMMON_API
    })

    Promise.all([
      image.save(),
      model.save()
    ])
    .then(([image, user]) => {
      userInfo = user
      selfToken = signToken(userInfo._id)
      const { model } = mockCreateComment({
        content: {
          text: COMMON_API,
          image: [ image._id ],
          video: []
        },
        user_info: userInfo._id
      })

      return model.save()
    })
    .then(data => {
      return UserModel.updateOne({
        username: COMMON_API
      }, {
        $push: { comment: data._id }
      })
    })
    .then(data => {
      done()
    })
    .catch(err => {
      console.log('oops', err)
    })

  })

  after(function(done) {

    Promise.all([
      UserModel.deleteMany({
        username: COMMON_API
      }),
      CommentModel.deleteMany({
        "content.text": COMMON_API
      }),
      ImageModel.deleteMany({
        src: COMMON_API
      })
    ])
    .then(_ => {
      done()
    })
    .catch(er => {
      console.log('oops', er)
    })

  })

  describe(`${COMMON_API} success test`, function() {

    it(`get the admin comment list success`, function(done) {
      
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

  })

  // describe(`${COMMON_API} fail test`, function() {
    
  // })

})