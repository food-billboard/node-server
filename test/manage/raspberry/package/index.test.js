require('module-alias/register')
const { expect } = require('chai')
const fs = require('fs-extra')
const path = require('path')
const { Types: { ObjectId } } = require('mongoose')
const { removePackage, createPackage } = require('@src/router/management/raspberry/package/utils')
const { UserModel, RaspberryModel, FRONT_END_PACKAGE_PATH } = require('@src/utils')
const { Request, commonValidate, mockCreateUser, parseResponse, mockCreateRaspberryPackage } = require('@test/utils')

const COMMON_API = '/api/manage/raspberry/package'
const COMMON_FOLDER = COMMON_API.split('/').join('')
const PACKAGE_URL = 'git@github.com:food-billboard/tool-box.git'
const TEMPLATE_PACKAGE_FOLDER = path.join(FRONT_END_PACKAGE_PATH, 'template')

function responseExpect(res, validate=[]) {
  const { res: { data: { list } } } = res

  expect(list).to.be.a("array")

  list.forEach(item => {
    expect(item).to.be.a("object").and.that.include.any.keys("_id", "name", "user", "folder", "description", "url", "createdAt", "updatedAt")
    commonValidate.objectId(item._id)
    commonValidate.string(item.name)
    commonValidate.string(item.description)
    commonValidate.string(item.folder)
    commonValidate.string(item.url)
    commonValidate.date(item.createdAt)
    commonValidate.date(item.updatedAt)
    expect(item.user).to.be.a('object').and.that.includes.any.keys('username', 'avatar', '_id')
    commonValidate.string(item.user.username)
    commonValidate.poster(item.user.poster)
    commonValidate.objectId(item.user._id)
  })

  if(Array.isArray(validate)) {
    validate.forEach(valid => {
      typeof valid == 'function' && valid(res.res)
    })
  }else if(typeof validate === 'function') {
    validate(res.res)
  }
}

describe(`${COMMON_API} test`, () => {

  let userInfo
  let selfToken
  let packageId 
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
      const { model } = mockCreateRaspberryPackage({
        name: COMMON_API,
        user: userInfo._id,
        folder: COMMON_FOLDER
      }) 
      return model.save()  
    })
    .then(data => {
      packageId = data._id 
      return fs.mkdir(path.join(FRONT_END_PACKAGE_PATH, COMMON_FOLDER))
    })
    .then(_ => {
      done()
    })
    .catch(err => {
      done(err)
    })

  })

  after(function(done) {

    Promise.all([
      RaspberryModel.deleteMany({
        name: COMMON_API
      }),
      UserModel.deleteMany({
        username: COMMON_API
      }),
      fs.rmdir(path.join(FRONT_END_PACKAGE_PATH, COMMON_FOLDER))
    ])
    .then(_ => {
      done()
    })
    .catch(err => {
      done(err)
    })

  })
  
  describe(`get the raspberry package list success test -> ${COMMON_API}`, function() {

    it(`get the raspberry package list success`, function(done) {

      Request
      .get(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .then(function(res) {
        let obj = parseResponse(res)
        responseExpect(obj, (target) => {
          const { total, list } = target.data 
          expect(total).to.be.not.equals(0)
          expect(list.some(item => item._id === packageId.toString())).to.be.true 
        })
      })
      .then(_ => {
        done()
      })
      .catch(err => {
        done(err)
      })

    })

  })

  describe(`post the raspberry package success test -> ${COMMON_API}`, function() {

    it(`post the raspberry package success`, function(done) {

      const data = {
        name: COMMON_FOLDER,
        description: '1111',
        folder: COMMON_FOLDER + Date.now(),
        url: PACKAGE_URL
      }

      let isError = false 

      Request
      .post(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send(data)
      .expect(200)
      .expect('Content-Type', /json/)
      .then(() => {
        return new Promise(resolve => setTimeout(resolve, 1000))
      })
      .then(function(res) {
        return Promise.all([
          RaspberryModel.findOne(data)
          .select({
            _id: 1
          })
          .exec(),
          fs.exists(path.join(TEMPLATE_PACKAGE_FOLDER, data.folder)),
        ])
      })
      .then(data => {
        isError = !data.every(Boolean)
        if(isError) {
          done('post success error')
        }else {
          return Promise.all([
            RaspberryModel.deleteOne({ _id: ObjectId(data[0]._id) }),
            fs.rmdir(path.join(FRONT_END_PACKAGE_PATH, data.folder))
          ])
        }
        
      })
      .then(_ => {
        done()
      })
      .catch(err => {
        done(err)
      })

    })

  })

  describe(`put the raspberry package success test -> ${COMMON_API}`, function() {
    
    it(`put the raspberry package name success and not rebuild`, function(done) {

      Request
      .get(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .then(function(res) {
        let obj = parseResponse(res)
        responseExpect(obj, (target) => {
          const { total, list } = target.data 
          expect(total).to.be.not.equals(0)
          expect(list.some(item => item._id === packageId.toString())).to.be.true 
        })
      })
      .then(_ => {
        done()
      })
      .catch(err => {
        done(err)
      })

    })

    it(`put the raspberry package url success and rebuild`, function(done) {

      Request
      .get(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .then(function(res) {
        let obj = parseResponse(res)
        responseExpect(obj, (target) => {
          const { total, list } = target.data 
          expect(total).to.be.not.equals(0)
          expect(list.some(item => item._id === packageId.toString())).to.be.true 
        })
      })
      .then(_ => {
        done()
      })
      .catch(err => {
        done(err)
      })

    })

    it(`put the raspberry package folder success and rename`, function(done) {

      Request
      .get(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .then(function(res) {
        let obj = parseResponse(res)
        responseExpect(obj, (target) => {
          const { total, list } = target.data 
          expect(total).to.be.not.equals(0)
          expect(list.some(item => item._id === packageId.toString())).to.be.true 
        })
      })
      .then(_ => {
        done()
      })
      .catch(err => {
        done(err)
      })

    })

  })

  describe('delete raspberry package success', function() {

    it(`delete raspberry package success`, function(done) {

      const { model } = mockCreateRaspberryPackage({
        name: COMMON_API,
        user: userInfo._id 
      }) 
      model.save()  
      .then(data => {
        return Request
        .delete(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .query({
          _id: data._id.toString()
        })
        .expect(200)
        .expect('Content-Type', /json/)
      })
      .then(_ => {
        done()
      })
      .catch(err => {
        done(err)
      })

    })

  })

  describe(`post the raspberry package fail test -> ${COMMON_API}`, function() {

    it(`post the raspberry package fail because the name is exists`, function(done) {

      Request
      .get(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .then(function(res) {
        let obj = parseResponse(res)
        responseExpect(obj, (target) => {
          const { total, list } = target.data 
          expect(total).to.be.not.equals(0)
          expect(list.some(item => item._id === packageId.toString())).to.be.true 
        })
      })
      .then(_ => {
        done()
      })
      .catch(err => {
        done(err)
      })

    })

    it(`post the raspberry package fail because the folder is exists`, function(done) {

      Request
      .get(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .then(function(res) {
        let obj = parseResponse(res)
        responseExpect(obj, (target) => {
          const { total, list } = target.data 
          expect(total).to.be.not.equals(0)
          expect(list.some(item => item._id === packageId.toString())).to.be.true 
        })
      })
      .then(_ => {
        done()
      })
      .catch(err => {
        done(err)
      })

    })

    it(`post the raspberry package fail because the url is exists`, function(done) {

      Request
      .get(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .then(function(res) {
        let obj = parseResponse(res)
        responseExpect(obj, (target) => {
          const { total, list } = target.data 
          expect(total).to.be.not.equals(0)
          expect(list.some(item => item._id === packageId.toString())).to.be.true 
        })
      })
      .then(_ => {
        done()
      })
      .catch(err => {
        done(err)
      })

    })

  })

  describe(`put the raspberry package fail test -> ${COMMON_API}`, function() {

    it(`put the raspberry package fail because the id is not exists`, function(done) {

      Request
      .get(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .then(function(res) {
        let obj = parseResponse(res)
        responseExpect(obj, (target) => {
          const { total, list } = target.data 
          expect(total).to.be.not.equals(0)
          expect(list.some(item => item._id === packageId.toString())).to.be.true 
        })
      })
      .then(_ => {
        done()
      })
      .catch(err => {
        done(err)
      })

    })
    
    it(`put the raspberry package fail because the name is exists`, function(done) {

      Request
      .get(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .then(function(res) {
        let obj = parseResponse(res)
        responseExpect(obj, (target) => {
          const { total, list } = target.data 
          expect(total).to.be.not.equals(0)
          expect(list.some(item => item._id === packageId.toString())).to.be.true 
        })
      })
      .then(_ => {
        done()
      })
      .catch(err => {
        done(err)
      })

    })

    it(`put the raspberry package fail because the folder is exists`, function(done) {

      Request
      .get(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .then(function(res) {
        let obj = parseResponse(res)
        responseExpect(obj, (target) => {
          const { total, list } = target.data 
          expect(total).to.be.not.equals(0)
          expect(list.some(item => item._id === packageId.toString())).to.be.true 
        })
      })
      .then(_ => {
        done()
      })
      .catch(err => {
        done(err)
      })

    })

    it(`put the raspberry package fail because the url is exists`, function(done) {

      Request
      .get(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .then(function(res) {
        let obj = parseResponse(res)
        responseExpect(obj, (target) => {
          const { total, list } = target.data 
          expect(total).to.be.not.equals(0)
          expect(list.some(item => item._id === packageId.toString())).to.be.true 
        })
      })
      .then(_ => {
        done()
      })
      .catch(err => {
        done(err)
      })

    })

  })


  describe(`delete the raspberry package fail test -> ${COMMON_API}`, function() {

    it(`delete raspberry package fail because the id is not valid`, function(done) {
      Request
      .delete(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
        _id: packageId.toString().slice(1)
      })
      .expect(400)
      .expect('Content-Type', /json/)
      .then(_ => {
        done()
      })
      .catch(err => {
        done(err)
      })
    })

    it(`delete raspberry package fail because the id is not found`, function(done) {

      const id = packageId.toString()

      Request
      .delete(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
        _id: `${(id.slice(0, 1) + 4) % 10}${id.slice(1)}`
      })
      .expect(403)
      .expect('Content-Type', /json/)
      .then(_ => {
        done()
      })
      .catch(err => {
        done(err)
      })
    })

  })

})