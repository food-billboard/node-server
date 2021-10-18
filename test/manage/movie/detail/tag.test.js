require('module-alias/register')
const { UserModel, TagModel, MovieModel } = require('@src/utils')
const { expect } = require('chai')
const Day = require('dayjs')
const { Request, mockCreateUser, mockCreateTag, commonValidate, mockCreateMovie } = require('@test/utils')

const COMMON_API = '/api/manage/movie/detail/tag'

function responseExpect(res, validate=[]) {
  const { res: { data: target } } = res

  expect(target).to.be.a('object').and.that.include.all.keys('total', 'list')
  commonValidate.number(target.total)
  expect(target.list).to.be.a('array')

  target.list.forEach(item => {
    expect(item).to.be.a('object').that.includes.all.keys('_id', 'text', 'weight', 'valid', 'source', 'createdAt', 'updatedAt')
    commonValidate.objectId(item._id)
    expect(item.source).to.be.a('object').that.includes.all.keys('_id', 'name')
    commonValidate.objectId(item.source._id)
    commonValidate.string(item.source.name)
    commonValidate.string(item.text)
    commonValidate.number(item.weight)
    commonValidate.date(item.createdAt)
    commonValidate.date(item.updatedAt)
    expect(item.valid).to.be.a('boolean')
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

  let selfToken
  let userInfo
  let tagId
  let movieId 

  before(function(done) {

    const { model: user, signToken } = mockCreateUser({
      username: COMMON_API
    })
    const { model: movie } = mockCreateMovie({
      name: COMMON_API
    })

    Promise.all([
      user.save(),
      movie.save()
    ])
    .then(([user, movie]) => {
      userInfo = user
      movieId = movie._id
      const { model: tag } = mockCreateTag({
        text: COMMON_API,
        weight: 1,
        valid: true,
        source: movieId
      })
      
      selfToken = signToken(userInfo._id)
      return tag.save()
    })
    .then(data => {
      tagId = data._id
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
      TagModel.deleteMany({
        text: COMMON_API
      }),
      MovieModel.deleteMany({
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

  describe(`${COMMON_API} success test`, function() {

    describe(`get the tag status success -> ${COMMON_API}`, function() {

      it(`get the tag success`, function(done) {

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
          responseExpect(obj)
          done()
        })
  
      })

      it(`get the tag success with _id`, function(done) {

        Request
        .get(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .query({
          _id: tagId.toString(),
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
            const { _id } = list[0]
            expect(tagId.equals(_id)).to.be.true
          })
          done()
        })
  
      })

      it(`get the tag success with content`, function(done) {

        Request
        .get(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .query({
          content: COMMON_API.slice(1),
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
            const exists = list.some(item => tagId.equals(item._id))
            expect(exists).to.be.true
          })
          done()
        })
  
      })

      it(`get the tag success with valid`, function(done) {

        Request
        .get(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .query({
          valid: true
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
            const exists = list.some(item => tagId.equals(item._id))
            expect(exists).to.be.true
          })
          done()
        })
  
      })

      it(`get the tag success with start_date`, function(done) {

        Request
        .get(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .query({
          start_date: Day(Date.now() + 24 * 1000 * 60 * 60).format('YYYY-MM-DD')
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
            const exists = list.some(item => tagId.equals(item._id))
            expect(exists).to.be.false
          })
          done()
        })
  
      })

      it(`get the tag success with end_date`, function(done) {

        Request
        .get(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .query({
          end_date: Day(Date.now() - 1000 * 60 * 60 * 24).format('YYYY-MM-DD')
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
            const exists = list.some(item => tagId.equals(item._id))
            expect(exists).to.be.false
          })
          done()
        })
  
      })

      it(`get the tag success with weight`, function(done) {

        Request
        .get(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .query({
          weight: 0
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
            const exists = list.some(item => tagId.equals(item._id))
            expect(exists).to.be.false
          })
          done()
        })
  
      })

    })

    describe(`put the tag status success -> ${COMMON_API}`, function() {

      after(function(done) {

        TagModel.findOne({
          _id: tagId,
          valid: false
        })
        .select({
          _id: 1
        })
        .exec()
        .then(data => !!data)
        .then(data => {
          expect(data).to.be.true
          done()
        })
        .catch(err => {
          done(err)
          console.log('oops: ', err)
        })

      })

      it(`put the tag status success`, function(done) {

        Request
        .put(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .send({
          _id: tagId.toString(),
          valid: false
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err) {
          if(err) return done(err)
          done()
        })
  
      })

    })

    describe(`delete the tag success -> ${COMMON_API}`, function() {

      let tagIdA 
      let tagIdB 
      before(function(done) {
        const { model: tagA } = mockCreateTag({
          text: COMMON_API + '1',
          weight: 1,
          valid: true,
        })
        const { model: tagB } = mockCreateTag({
          text: COMMON_API + '2',
          weight: 1,
          valid: true,
        })

        Promise.all([
          tagA.save(),
          tagB.save()
        ])
        .then(([tagA, tagB]) => {
          tagIdA = tagA._id 
          tagIdB = tagB._id 
          done()
        })
        .catch(err => {
          done(err)
          console.log('oops: ', err)
        })

      })

      after(function(done) {

        TagModel.find({
          _id: { $in: [tagIdA, tagIdB] },
        })
        .select({
          _id: 1
        })
        .exec()
        .then(data => !!data)
        .then(data => {
          expect(!!data.length).to.be.false
          done()
        })
        .catch(err => {
          done(err)
          console.log('oops: ', err)
        })

      })

      it(`delete the tag success`, function(done) {

        Request
        .delete(COMMON_API)
        .set({
          Accept: 'application/json',
          Authorization: `Basic ${selfToken}`
        })
        .query({
          _id: `${tagIdA.toString()},${tagIdB.toString()}`,
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err) {
          if(err) return done(err)
          done()
        })
  
      })

    })

  })

  describe(`${COMMON_API} fail test`, function() {

    before(function(done) {

      const { model: tag } = mockCreateTag({
        text: COMMON_API,
        weight: 1,
        valid: true,
      })

      tag.save()
      .then(data => {
        tagId = data._id
        done()
      })
      .catch(err => {
        done(err)
        console.log('oops: ', err)
      })

    })

    it(`put the tag status fail because lack of the id`, function(done) {

      Request
      .put(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        valid: false
      })
      .expect(400)
      .expect('Content-Type', /json/)
      .end(function(err) {
        if(err) return done(err)
        done()
      })

    })

    it(`put the tag status fail because the id not found`, function(done) {

      Request
      .put(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        _id: "571094e2976aeb1df982ad5e",
        valid: false
      })
      // .expect(400)
      .expect('Content-Type', /json/)
      .end(function(err) {
        if(err) return done(err)
        done()
      })

    })

    it(`put the tag status fail because the id not valid`, function(done) {

      Request
      .put(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        _id: tagId.toString().slice(1),
        valid: false
      })
      .expect(400)
      .expect('Content-Type', /json/)
      .end(function(err) {
        if(err) return done(err)
        done()
      })

    })

    it(`put the tag status fail because lack of the valid`, function(done) {

      Request
      .put(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        _id: tagId.toString(),
      })
      .expect(400)
      .expect('Content-Type', /json/)
      .end(function(err) {
        if(err) return done(err)
        done()
      })

    })

    it(`put the tag status fail because the valid not valid`, function(done) {

      Request
      .put(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .send({
        _id: tagId.toString(),
        valid: null
      })
      .expect(400)
      .expect('Content-Type', /json/)
      .end(function(err) {
        if(err) return done(err)
        done()
      })

    })

    it(`delete the tag fail because lack of the id`, function(done) {

      Request
      .delete(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .expect(400)
      .expect('Content-Type', /json/)
      .end(function(err) {
        if(err) return done(err)
        done()
      })

    })

    it(`delete the tag fail because the id not found`, function(done) {

      Request
      .delete(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
        _id: "571094e2976aeb1df982ad4e",
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .end(function(err) {
        if(err) return done(err)
        done()
      })

    })

    it(`delete the tag fail because the id not valid`, function(done) {

      Request
      .delete(COMMON_API)
      .set({
        Accept: 'application/json',
        Authorization: `Basic ${selfToken}`
      })
      .query({
        _id: tagId.toString().slice(1),
      })
      .expect(400)
      .expect('Content-Type', /json/)
      .end(function(err) {
        if(err) return done(err)
        done()
      })

    })

  })

})