require('module-alias/register')
const { mockCreateUser, Request, createEtag, commonValidate } = require('@test/utils')
const { UserModel } = require('@src/utils')
const { expect } = require('chai')

const COMMON_API = '/api/user/customer/fans'

function responseExpect(res, validate=[]) {

  const { res: { data: target } } = res

  expect(target).to.be.a('object').and.that.includes.all.keys('fans')
  target.fans.forEach(item => {
    expect(item).to.be.a('object').and.includes.all.keys('avatar', 'username', '_id')
    //avatar
    commonValidate.poster(item.avatar)
    //username
    commonValidate.string(item.username)
    //_id
    commonValidate.objectId(item._id)
  })

  if(Array.isArray(validate)) {
    validate.forEach(valid => {
      typeof valid == 'function' && valid(target)
    })
  }else if(typeof validate == 'function') {
    validate(target)
  }
}

describe(`${COMMON_API} test`, function() {

  describe(`get another user fans test -> ${COMMON_API}`, function() {

    let fansId
    let result

    before(function(done) {

      const { model } = mockCreateUser({
        username: COMMON_API,
        mobile: 15256981236
      })
      model.save()
      .then(function(data) {
        const { _id } = data
        result = data
        fansId = _id
        const { model } = mockCreateUser({
          username: COMMON_API,
          attentions: [
            { _id }
          ]
        })

        return model.save()
      })
      .then(function(data) {
        return UserModel.updateOne({
          mobile: 11256981236
        }, {
          $set: {
            fans: [ { _id: data._id } ]
          }
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
      UserModel.deleteMany({
        username: COMMON_API
      })
      .then(function() {
        done()
      })
    })

    describe(`get another user fans success test -> ${COMMON_API}`, function() {

      beforeEach(async function() {

        updatedAt = await UserModel.findOne({
          _id: result.id
        })
        .select({
          _id: 0,
          updatedAt: 1
        })
        .then(data => {
          return data._doc.updatedAt
        })
        .catch(err => {
          console.log('oops: ', err)
          return false
        })

        return !!updatedAt ? Promise.resolve() : Promise.reject()

      })

      it(`get another user fans success`, function(done) {

        Request
        .get(COMMON_API)
        .query({ _id: result._id.toString() })
        .set('Accept', 'Appication/json')
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

      it(`get another user fans and return the status of 304`, function(done) {
        
        const query = {
          _id: result._id.toString()
        }
        
        Request
        .get(COMMON_API)
        .query(query)
        .set('Accept', 'Appication/json')
        .set('If-Modified-Since', updatedAt)
        .set('If-None-Match', createEtag(query))
        .expect(304)
        .expect('Last-Modified', updatedAt.toString())
        .expect('ETag', createEtag(query))
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

    })

    describe(`get another user fans fail test -> ${COMMON_API}`, function() {
      
      it(`get another user fans because the user id is not found`, function(done) {
        
        const errorId = result._id.toString()

        Request
        .get(COMMON_API)
        .query({ _id: `${(parseInt(errorId.slice(0, 1)) + 5) % 10}${errorId.slice(1)}` })
        .set('Accept', 'Appication/json')
        .expect(404)
        .expect('Content-Type', /json/)
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

      it(`get another user fans because the user id is not verify`, function(done) {

        Request
        .get(COMMON_API)
        .query({ _id: result._id.toString().slice(1) })
        .set('Accept', 'Appication/json')
        .expect(400)
        .expect('Content-Type', /json/)
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

    })

  })

})