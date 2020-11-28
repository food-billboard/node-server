require('module-alias/register')
const { MovieModel, UserModel, ClassifyModel, ImageModel } = require('@src/utils')
const { expect } = require('chai')
const { Request, commonValidate, mockCreateMovie, mockCreateClassify, mockCreateUser, mockCreateImage } = require('@test/utils')
const { Types: { ObjectId } } = require("mongoose")
const Day = require('dayjs')

const COMMON_API = '/api/manage/movie'

function responseExpect(res, validate=[]) {
  const { res: { data: target } } = res

  expect(target).to.be.a('object').and.that.include.all.keys('total', 'list')
  commonValidate.number(target.total)
  expect(target.list).to.be.a('array')

  target.list.forEach(item => {
    expect(item).to.be.a('object').and.that.include.all.keys('_id', 'name', 'author', 'comment_count', 'total_rate', 'rate_person', 'createdAt', 'updatedAt', 'source_type', 'glance', 'hot', 'status', 'tag_count', 'barrage_count')
    commonValidate.objectId(item._id)
    commonValidate.string(item.name)
    expect(item.author).to.be.a('object').and.that.include.all.keys('_id', 'username')
    commonValidate.objectId(item.author._id)
    commonValidate.string(item.author.username)
    commonValidate.number(item.comment_count)
    commonValidate.number(item.total_rate)
    commonValidate.number(item.rate_person)
    commonValidate.date(item.createdAt)
    commonValidate.date(item.updatedAt)
    commonValidate.string(item.source_type)
    commonValidate.number(item.glance)
    commonValidate.number(item.hot)
    commonValidate.number(item.tag_count)
    commonValidate.number(item.barrage_count)
    commonValidate.string(item.status)
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
  let classifyId
  let classifyMovieId
  let statusId
  let sourceTypeId
  let otherUserId
  let imageId
  let getToken

  let newMovie = {
    actor: [ ObjectId('571094e2976aeb1df982ad4e') ],
    director: [ ObjectId('571094e2976aeb1df982ad4e') ],
    district: [ ObjectId('571094e2976aeb1df982ad4e') ],
    classify: [ ObjectId('571094e2976aeb1df982ad4e') ],
    language: [ ObjectId('571094e2976aeb1df982ad4e') ],
    screen_time: '2020-11-20',
    video: ObjectId('571094e2976aeb1df982ad4e'),
    images: [ ObjectId('571094e2976aeb1df982ad4e') ],
    poster: ObjectId('571094e2976aeb1df982ad4e'),
    author_description: COMMON_API,
    author_rate: 10,
    name: COMMON_API, 
    alias: [ COMMON_API ], 
    description: COMMON_API
  }

  before(function(done) {

    const { model: image } = mockCreateImage({
      src: COMMON_API
    })

    const { model: user, token, signToken } = mockCreateUser({
      username: COMMON_API
    })
    const { model: otherUser } = mockCreateUser({
      username: COMMON_API
    })
    const { model:classify } = mockCreateClassify({
      name: COMMON_API,
      // roles: [ 'CUSTOMER' ]
    })
    getToken = signToken

    Promise.all([
      user.save(),
      classify.save(),
      otherUser.save(),
      image.save()
    ])
    .then(([ user, classify, otherUser, image ]) => {
      userInfo = user
      classifyId = classify._id
      otherUserId = otherUser._id
      imageId = image._id
      selfToken = getToken(userInfo._id)

      newMovie = {
        ...newMovie,
        poster: imageId,
        images: new Array(6).fill(imageId)
      }
      return Promise.all(['classify', 'status', 'sourceType'].map(item => {
        const { model } = mockCreateMovie({
          name: `${COMMON_API}-${item}`,
          author: userInfo._id,
          ...(item == 'classify' ? { info: { classify: [ classifyId ] } } : {}),
          ...(item === 'status' ? { status: 'NOT_VERIFY' } : {}),
          ...(item === 'sourceType' ? { source_type: 'USER' } : {}),
          author_description: COMMON_API
        })
        return model.save()
      }))
    })
    .then(([classify, status, sourceType]) => {
      classifyMovieId = classify._id
      statusId = status._id
      sourceTypeId = sourceType._id
      done()
    })
    .catch(err => {
      console.log('oops: ', err)
    })

  })

  after(function(done) {

    Promise.all([
      MovieModel.deleteMany({
        author_description: COMMON_API
      }),
      UserModel.deleteMany({
        username: COMMON_API
      }),
      ClassifyModel.deleteMany({
        name: COMMON_API
      }),
      ImageModel.deleteMany({
        src: COMMON_API
      })
    ])
    .then(data => {
      done()
    })
    .catch(err => {
      console.log('oops: ', err)
    })

  })

  beforeEach(function(done) {
    selfToken = getToken(userInfo._id)
    done()
  })

  describe(`${COMMON_API} success test`, function() {

    describe(`get the movie list success with classify -> ${COMMON_API}`, function() {

      it(`get the movie list success`, function(done) {

        Request
        .get(COMMON_API)
        .query({
          classify: classifyId.toString()
        })
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
          responseExpect(obj, (target) => {
            const { list } = target
            expect(list.length).to.not.be.equals(0)
            const exists = list.some(item => classifyMovieId.equals(item._id))
            expect(exists).to.be.true
          })
          done()
        })

      })

    })

    describe(`get the movie list success with status -> ${COMMON_API}`, function() {

      it(`get the movie list success with status`, function(done) {

        Request
        .get(COMMON_API)
        .query({
          status: 'NOT_VERIFY'
        })
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
          responseExpect(obj, (target) => {
            const { list } = target
            expect(list.length).to.be.equals(1)
          })
          done()
        })

      })

    })

    describe(`get the movie list success with source_type -> ${COMMON_API}`, function() {

      it(`get the movie list success with source_type`, function(done) {

        Request
        .get(COMMON_API)
        .query({
          source_type: 'USER'
        })
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
          responseExpect(obj, (target) => {
            const { list } = target
            expect(list.length).to.be.equals(1)
          })
          done()
        })

      })

    })

    describe(`get the movie list success with end_date -> ${COMMON_API}`, function() {

      it(`get the movie list success with end_date`, function(done) {

        Request
        .get(COMMON_API)
        .query({
          end_date: new Date(2019)
        })
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
          responseExpect(obj, (target) => {
            const { list } = target
            const exists = list.every(item => Day(item.createdAt).year() <= 2019)
            expect(exists).to.be.true
          })
          done()
        })

      })

    })

    describe(`get the movie list success with start_date -> ${COMMON_API}`, function() {

      it(`get the movie list success with start_date`, function(done) {

        Request
        .get(COMMON_API)
        .query({
          start_date: new Date(2020)
        })
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
          responseExpect(obj, (target) => {
            const { list } = target
            expect(list.length).to.be.equals(0)
          })
          done()
        })

      })

    })

    describe(`get the movie list success with content -> ${COMMON_API}`, function() {

      it(`get the movie list success with content`, function(done) {

        Request
        .get(COMMON_API)
        .query({
          content: `${COMMON_API}-classify`
        })
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
          responseExpect(obj, (target) => {
            const { list } = target
            expect(list.length).to.be.equals(1)
          })
          done()
        })

      })

    })
    
    describe(`post the movie success -> ${COMMON_API}`, function() {

      after(function(done) {

        MovieModel.findOne({
          name: COMMON_API
        })
        .select({
          _id: 1
        })
        .exec()
        .then(function(data) {
          expect(!!data).to.be.true
          done()
        })
        .catch(err => {
          console.log('oops: ', err)
        })

      })

      it(`post the movie success`, function(done) {

        Request
        .post(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .send(newMovie)
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if(err) return done(err)
          done()
        })

      })

    })

    describe(`put the movie success -> ${COMMON_API}`, function() {

      after(function(done) {
        MovieModel.findOne({
          name: COMMON_API
        })
        .select({
          _id: 1
        })
        .exec()
        .then(function(data) {
          expect(!!data).to.be.true
          done()
        })
        .catch(err => {
          console.log('oops: ', err)
        })
      })

      it(`put the movie success`, async function() {

        let res = true

        await UserModel.updateOne({
          username: COMMON_API
        }, {
          $set: {
            roles: [ 'SUPER_ADMIN' ]
          }
        })
        .catch(err => {
          console.log(err)
          res = false
        })

        Request
        .put(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .send({
          ...newMovie,
          _id: sourceTypeId.toString()
        })
        .expect(200)
        .expect('Content-Type', /json/)

        return res ? Promise.resolve() : Promise.reject()

      })

      it(`put the movie success and the author is not self but self has the auth`, async function() {

        let res = true

        await UserModel.updateOne({
          username: COMMON_API
        }, {
          $set: {
            roles: [ 'SUPER_ADMIN' ]
          }
        })
        .catch(err => {
          console.log(err)
          res = false
        })

        await MovieModel.updateOne({
          _id: sourceTypeId
        }, {
          $set: {
            author: otherUserId
          }
        })
        .catch(err => {
          console.log(err)
          res = false
        })

        Request
        .put(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .send({
          ...newMovie,
          _id: sourceTypeId.toString()
        })
        .expect(200)
        .expect('Content-Type', /json/)

        return res ? Promise.resolve() : Promise.reject()

      })

    })

    describe(`delete the movie success -> ${COMMON_API}`, function() {

      after(function(done) {
        
        MovieModel.findOne({
          _id: statusId
        })
        .select({
          _id: 1
        })
        .exec()
        .then(data => {
          console.log(data)
          expect(!!data).to.be.false
          done()
        })
        .catch(err => {
          console.log('oops: ', err)
          done(err)
        })

      })

      it(`delete the movie success`, function(done) {

        Request
        .delete(COMMON_API)
        .query({
          _id: statusId.toString()
        })
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
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

    describe(`post the movie fail -> ${COMMON_API}`, function() {

      it(`post the movie fail because the actor is not verify`, function(done) {

        Request
        .post(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .send({
          ...newMovie,
          actor: []
        })
        .expect(400)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if(err) return done(err)
          done()
        })

      })

      it(`post the movie fail because the director is not verify`, function(done) {

        Request
        .post(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .send({
          ...newMovie,
          director: []
        })
        .expect(400)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if(err) return done(err)
          done()
        })

      })

      it(`post the movie fail because the district is not verify`, function(done) {

        Request
        .post(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .send({
          ...newMovie,
          district: []
        })
        .expect(400)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if(err) return done(err)
          done()
        })

      })

      it(`post the movie fail because the classify is not verify`, function(done) {

        Request
        .post(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .send({
          ...newMovie,
          classify: []
        })
        .expect(400)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if(err) return done(err)
          done()
        })

      })

      it(`post the movie fail because the language is not verify`, function(done) {

        Request
        .post(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .send({
          ...newMovie,
          language: []
        })
        .expect(400)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if(err) return done(err)
          done()
        })

      })

      it(`post the movie fail because the screen_time is not verify`, function(done) {

        Request
        .post(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .send({
          ...newMovie,
          screen_time: 'null'
        })
        .expect(400)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if(err) return done(err)
          done()
        })

      })

      it(`post the movie fail because the video is not verify`, function(done) {

        Request
        .post(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .send({
          ...newMovie,
          video: 'null'
        })
        .expect(400)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if(err) return done(err)
          done()
        })

      })

      it(`post the movie fail because the images is not verify`, function(done) {

        Request
        .post(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .send({
          ...newMovie,
          images: []
        })
        .expect(400)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if(err) return done(err)
          done()
        })

      })

      it(`post the movie fail because the poster is not verify`, function(done) {

        Request
        .post(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .send({
          ...newMovie,
          poster: null
        })
        .expect(400)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if(err) return done(err)
          done()
        })

      })

      it(`post the movie fail because the author_rate is not verify`, function(done) {

        Request
        .post(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .send({
          ...newMovie,
          author_rate: 11
        })
        .expect(400)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if(err) return done(err)
          done()
        })

      })

      it(`post the movie fail because the name is not verify`, function(done) {

        Request
        .post(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .send({
          ...newMovie,
          name: ''
        })
        .expect(400)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if(err) return done(err)
          done()
        })

      })

      it(`post the movie fail because the description is not verify`, function(done) {

        Request
        .post(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .send({
          ...newMovie,
          description: ''
        })
        .expect(400)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if(err) return done(err)
          done()
        })

      })

      it(`post the movie fail because the movie is exists`, function(done) {

        done()

      })

    })

    describe(`put the movie fail -> ${COMMON_API}`, function() {

      before(function(done) {
        Promise.all([
          UserModel.updateMany({
            username: COMMON_API
          }, {
            $set: { roles: [ 'DEVELOPMENT' ] }
          }),
          MovieModel.updateOne({
            _id: sourceTypeId
          }, {
            $set: { author: otherUserId }
          })
        ])  
        .then(data => {
          done()
        })
        .catch(err => {
          console.log('oops: ', err)
        })
      })

      it(`put the movie fail because the self is not the auth`, function(done) {

        Request
        .put(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .send({
          ...newMovie,
          _id: sourceTypeId.toString()
        })
        .expect(403)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if(err) return done(err)
          done()
        })

      })
      
    })

    describe(`delete the movie fail -> ${COMMON_API}`, function() {

      before(function(done) {

        UserModel.updateOne({
          _id: userInfo._id
        }, {
          $set: { roles: [ 'SUPER_ADMIN' ] }
        })
        .then(data => {
          done()
        })
        .catch(err => {
          console.log('oops: ', err)
        })

      })
      
      it(`delete the movie fail beause the movie id is not verify`, function(done) {

        Request
        .delete(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .query({
          _id: sourceTypeId.toString().slice(1)
        })
        .expect(400)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if(err) return done(err)
          done()
        })

      })

      it(`delete the movie fail because lack of the movie id`, function(done) {

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

      it(`delete the movie fail because the user is not authorization`, async function() {
        
        let res = true

        await UserModel.updateOne({
          _id: userInfo._id
        }, {
          $set: { roles: [ 'SUB_DEVELOPMENT' ] }
        })
        .catch(err => {
          console.log('oops: ', err)
          res = false
        })

        Request
        .delete(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .query({
          _id: sourceTypeId.toString()
        })
        .expect(403)
        .expect('Content-Type', /json/)

        return res ? Promise.resolve() : Promise.reject()

      })

    })

  })

})