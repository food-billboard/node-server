require('module-alias/register')
const { expect } = require('chai')
const { mockCreateUser, Request, commonValidate, parseResponse, deepParseResponse, mockCreateMovie } = require('@test/utils')
const { UserModel, MovieModel } = require('@src/utils')

const COMMON_API = '/api/customer/user/movie/issue'

function responseExpect(res, validate=[]) {

  const { res: { data: target } } = res

  expect(target).to.be.a('object').and.that.have.a.property('issue')

  target.issue.forEach(item => {
    expect(item).to.be.a('object').and.includes.any.keys('description', 'name', 'poster', '_id', 'store', 'rate', 'classify', 'publish_time', 'hot', "author", "images")
    commonValidate.string(item.description, function() { return true })
    commonValidate.string(item.name)
    commonValidate.poster(item.poster)
    commonValidate.objectId(item._id)
    expect(item.store).to.be.a('boolean')
    commonValidate.number(item.rate)
    expect(item.images).to.be.a("array")
    item.images.forEach(item => commonValidate.string(item))
    //classify
    expect(item.classify).to.be.a('array')
    item.classify.forEach(classify => {
      expect(classify).to.be.a('object').and.that.has.a.property('name').and.that.is.a('string')
    })
    commonValidate.time(item.publish_time) 
    commonValidate.number(item.hot)
    expect(item.author).to.be.a("object").and.that.include.any.keys("username", "_id", "avatar")
    commonValidate.string(item.author.username)
    if(item.author.avatar) commonValidate.poster(item.author.avatar)
    commonValidate.objectId(item.author._id)
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

  describe(`get the user issue list and not self and with self info test -> ${COMMON_API}`, function() {

    let userResult
    let issueUserId 
    let targetMovieId  
    let selfToken 

    before(function(done) {
      
      const { model:issue } = mockCreateUser({
        username: COMMON_API,
      })
      const { model:movie } = mockCreateMovie({
        name: COMMON_API,
      }) 
      const { model:self, signToken } = mockCreateUser({
        username: COMMON_API,
      })
      
      Promise.all([
        issue.save(),
        self.save(),
        movie.save()
      ])
      .then(function([issue, self, movie]) {
        userResult = self
        issueUserId = issue._id
        targetMovieId = movie._id 
        selfToken = signToken(self._id)
        return Promise.all([
          UserModel.updateOne({
            _id: issueUserId
          }, {
            $set: {
              issue: [
                {
                  _id: targetMovieId,
                  timestamps: 100
                }
              ]
            }
          }),
          MovieModel.updateOne({
            _id: targetMovieId
          }, {
            $set: {
              author: userResult._id 
            }
          })
        ])
      })
      .then(function(_) {
        done()
      })
      .catch(err => {
        done(err)
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
      .then(function() {
        done()
      })
      .catch(err => {
        done(err)
      })
    })

    describe(`get the user issue list and not self and with self info success test -> ${COMMON_API}`, function() {

      it(`get the user issue list and not self and with self info success`, function(done) {

        Promise.all([
          UserModel.updateOne({
            _id: userResult._id 
          }, {
            $set: {
              store: []
            }
          }),
        ])
        .then(_ => {
          return Request
          .get(COMMON_API)
          .query({
            _id: issueUserId.toString(),
          })
          .set({
            Accept: 'Application/json',
            Authorization: `Basic ${selfToken}`
          })
          .expect(200)
          .expect('Content-Type', /json/)
        })
        .then(function(res) {
          let obj = parseResponse(res)
          responseExpect(obj, target => {
            expect(target.issue.some(item => {
              return item._id === targetMovieId.toString() && item.store
            })).to.be.false 
          })
        })
        .then(_ => {
          done()
        })
        .catch(err => {
          done(err)
        })

      })

      it(`get the user issue list and not self and with self info success and self is the store the movie`, function(done) {

        Promise.all([
          UserModel.updateOne({
            _id: userResult._id 
          }, {
            $set: {
              store: [
                {
                  timestamps: 100,
                  _id: targetMovieId
                }
              ]
            }
          }),
        ])
        .then(_ => {
          return Request
          .get(COMMON_API)
          .query({
            _id: issueUserId.toString(),
          })
          .set({
            Accept: 'Application/json',
            Authorization: `Basic ${selfToken}`
          })
          .expect(200)
          .expect('Content-Type', /json/)
        })
        .then(function(res) {
          let obj = parseResponse(res)
          responseExpect(obj, target => {
            expect(target.issue.some(item => {
              return item._id === targetMovieId.toString() && item.store
            })).to.be.true  
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

    describe(`get the user issue list and not self and with self info fail test -> ${COMMON_API}`, function() {

      it(`get the user issue list and not self and with self info fail because the user id is not found`, function(done) {

        const id = issueUserId.toString()

        Request
        .get(COMMON_API)
        .query({'_id': `${(parseInt(id.slice(0, 1)) + 5) % 10}${id.slice(1)}`})
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          if(err) return done(err)
          const obj = deepParseResponse(res)
          expect(obj.issue.length).to.be.equal(0)
          done()
        })

      })

      it(`get the user issue list and not self and with self info fail because the user id is not verify`, function(done) {
        
        Request
        .get(COMMON_API)
        .query('_id', issueUserId.toString().slice(1))
        .set({
          Accept: 'Application/json',
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

})
