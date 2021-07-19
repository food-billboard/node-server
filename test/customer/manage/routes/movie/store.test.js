require('module-alias/register')
const { expect } = require('chai')
const { mockCreateUser, Request, createEtag, commonValidate, mockCreateClassify, mockCreateMovie } = require('@test/utils')
const { UserModel, ClassifyModel, MovieModel } = require('@src/utils') 
const Day = require('dayjs')

const COMMON_API = '/api/customer/manage/movie/store'

function responseExpect(res, validate=[]) {

  const { res: { data: target } } = res

  expect(target).to.be.a('object').and.that.have.a.property('store')

  target.store.forEach(item => {
    expect(item).to.be.a('object').and.includes.all.keys('description', 'name', 'poster', '_id', 'store', 'rate', 'classify', 'publish_time', 'hot')
    commonValidate.string(item.description, function() { return true })
    commonValidate.string(item.name)
    commonValidate.poster(item.poster)
    commonValidate.objectId(item._id)
    expect(item.store).to.be.a('boolean')
    commonValidate.number(item.rate)
    //classify
    expect(item.classify).to.be.a('array').and.that.lengthOf.above(0)
    item.classify.forEach(classify => {
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

  describe(`get the self store list test -> ${COMMON_API}`, function() {

    let selfToken
    let updatedAt
    let userId
    let result
    let getToken

    before(async function() {
      const { model } = mockCreateClassify({
        name: COMMON_API
      })

      await model.save()
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
        const { model, signToken } = mockCreateUser({
          username: COMMON_API,
          glance: [ { _id: data._id } ],
          store: [ { _id: data._id } ]
        })
        getToken = signToken

        return model.save()
      })
      .then(function(data) {
        result = data
        userId = result._id
        selfToken = getToken(userId)
      })
      .catch(err => {
        console.log('oops: ', err)
      })

      return Promise.resolve()

    })

    after(async function() {
      await Promise.all([
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
      .catch(err => {
        console.log('oops: ', err)
      })

      return Promise.resolve()

    })

    describe(`get the self store list success test -> ${COMMON_API}`, function() {

      beforeEach(async function() {

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

      it(`get the self store list success`, function(done) {

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
          responseExpect(obj)
          done()
        })

      })

      it.skip(`get the self store list success and return the status of 304`, function(done) {

        Request
        .get(COMMON_API)
        .set({
          Accept: 'Application/json',
          'If-Modified-Since': updatedAt,
          'If-None-Match': createEtag({}),
          Authorization: `Basic ${selfToken}`
        })
        .expect(304)
        .expect('Last-Modified', updatedAt.toString())
        .expect('ETag', createEtag({}))
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

      it.skip(`get the self store list success and hope return the status of 304 but the content has edited`, function(done) {


        Request
        .get(COMMON_API)
        .set({
          Accept: 'Application/json',
          'If-Modified-Since': new Date(Day(updatedAt).valueOf - 10000000),
          'If-None-Match': createEtag({}),
          Authorization: `Basic ${selfToken}`
        })
        .expect(200)
        .expect('Last-Modified', updatedAt.toString())
        .expect('ETag', createEtag({}))
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

      it.skip(`get the self store list success and hope return the status of 304 but the params of query is change`, function(done) {

        const query = {
          pageSize: 10
        }

        Request
        .get(COMMON_API)
        .query(query)
        .set({
          Accept: 'Application/json',
          'If-Modified-Since': new Date(Day(updatedAt).valueOf - 10000000),
          'If-None-Match': createEtag({}),
          Authorization: `Basic ${selfToken}`
        })
        .expect(200)
        .expect('Last-Modified', updatedAt.toString())
        .expect('ETag', createEtag(query))
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

    })

  })

}) 