require('module-alias/register')
const { expect } = require('chai')
const { mockCreateUser, mockCreateMovie, mockCreateClassify, Request, createEtag, commonValidate } = require('@test/utils')
const { UserModel, MovieModel, ClassifyModel } = require('@src/utils')
const mongoose = require('mongoose')
const { Types: { ObjectId } } = mongoose

const COMMON_API = '/api/user/customer/movie/store'

function responseExpect(res, validate=[]) {

  const { res: { data: target } } = res

  expect(target).to.be.a('object').and.have.a.property('store').and.that.is.a('array')

  target.store.forEach(item => {
    expect(item).to.be.a('object').and.includes.all.keys('description', 'name', 'poster', '_id', 'store', 'rate', 'classify', 'publish_time', 'hot')
    commonValidate.string(item.description, () => true)
    commonValidate.string(item.name)
    commonValidate.poster(item.poster)
    commonValidate.objectId(item._id)
    commonValidate.number(item.rate)
    //classify
    expect(item.classify).to.be.a('array').and.that.lengthOf.above(0)
    item.forEach(classify => {
      expect(classify).to.be.a('object').and.that.has.a.property('name').and.that.is.a('string')
    })
    commonValidate.time(item.publish_time)
    commonValidate.number(item.hot)
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

  describe(`get another user store movie list without self info test -> ${COMMON_API}`, function() {

    let result
    let userId
    let updatedAt

    before(function(done) {
      const { model } = mockCreateClassify({
        name: COMMON_API
      })

      model.save()
      .then(data => {
        const { model } = mockCreateMovie({
          name: COMMON_API,
          info: {
            classify: [ data._id ]
          }
        })

        return model.save()
      })
      .then(function(data) {
        const { model } = mockCreateUser({
          username: COMMON_API,
          glance: [ data._id ]
        })

        return model.save()
      })
      .then(function(data) {
        result = data
        userId = result._id
        done()
      })
      .catch(err => {
        console.log('oops: ', err)
      })
    })

    after(function(done) {
      Promise.all([
        UserModel.deleteOne({
          username: COMMON_API
        }),
        MovieModel.deleteOne({
          name: COMMON_API
        }),
        ClassifyModel.deleteOne({
          name: COMMON_API
        })
      ])
      .then(function() {
        done()
      })
      .catch(err => {
        console.log('oops: ', err)
      })
    })

    describe(`get another user store movie list without self info success test -> ${COMMON_API}`, function() {

      before(async function() {

        updatedAt = await UserModel.findOne({
          username: COMMON_API
        })
        .select({
          _id: 0,
          updatedAt: 1
        })
        .exec()
        .then(data => {
          return data._doc.updatedAt
        })
        .catch(err => {
          console.log('oops: ', err)
          return false
        })

        return !!updatedAt ? Promise.resolve() : Promise.reject()

      })

      it(`get another user store movie list without self info success`, function(done) {

        Request
        .get(COMMON_API)
        .query({'_id': userId.toString()})
        .set('Accept', 'Application/json')
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

      it(`get another user store movie list without self info success and return the status 304`, function(done) {

        const query = {
          _id: userId.toString()
        }
        
        Request
        .get(COMMON_API)
        .query(query)
        .set({
          Accept: 'Application/json',
          'If-Modified-Since': updatedAt,
          'If-None-Match': createEtag(query)
        })
        .expect(304)
        .expect('Last-Modified', updatedAt.toString())
        .expect('ETag', createEtag(query))
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

    })

    describe(`get another user store movie list without self info fail test -> ${COMMON_API}`, function() {
      
      it(`get another user store movie list without self info fail because the user id is not found`, function(done) {
        
        const errorId = userId.toString()

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

      it(`get another user store movie list without self info fail because the user id is not verify`, function(done) {
        
        Request
        .get(COMMON_API)
        .query({ _id: userId.toString().slice(1) })
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