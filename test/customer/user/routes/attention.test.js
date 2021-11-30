require('module-alias/register')
const { expect } = require('chai')
const { mockCreateUser, Request, commonValidate, parseResponse, deepParseResponse } = require('@test/utils')
const { UserModel } = require('@src/utils')

const COMMON_API = '/api/customer/user/attention'

function responseExpect(res, validate=[]) {

  const { res: { data: target } } = res

  //data
  expect(target).to.be.a("array")
  target.forEach((item) => {
    expect(item).is.a('object').that.includes.any.keys('username', '_id', 'description', 'attention', 'avatar')
    commonValidate.string(item.username)
    commonValidate.string(item.description)
    commonValidate.poster(item.avatar)
    commonValidate.objectId(item._id)
    expect(item.attention).to.be.a("boolean")
  
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

  describe(`get the user attention list and not self and with self info test -> ${COMMON_API}`, function() {

    let userResult
    let attentionUserId 
    let targetUserId 
    let selfToken 

    before(function(done) {
      
      const { model:target } = mockCreateUser({
        username: COMMON_API,
      })
      const { model:attention } = mockCreateUser({
        username: COMMON_API,
      }) 
      const { model:self, signToken } = mockCreateUser({
        username: COMMON_API,
      })
      
      Promise.all([
        target.save(),
        self.save(),
        attention.save()
      ])
      .then(function([target, self, attention]) {
        userResult = self
        targetUserId = target._id
        attentionUserId = attention._id 
        selfToken = signToken(self._id)

        return Promise.all([
          UserModel.updateOne({
            _id: targetUserId._id
          }, {
            $set: { 
              attentions: [
                {
                  timestamps: 100,
                  _id: attentionUserId
                }
              ]
            }
          }),
          UserModel.updateOne({
            _id: attentionUserId._id
          }, {
            $set: { 
              fans: [
                {
                  timestamps: 100,
                  _id: targetUserId
                }
              ]
            }
          }),
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
      ])
      .then(function() {
        done()
      })
      .catch(err => {
        done(err)
      })
    })

    describe(`get the user attention list and not self and with self info success test -> ${COMMON_API}`, function() {

      it(`get the user attention list and not self and with self info success`, function(done) {

        Promise.all([
          UserModel.updateOne({
            _id: userResult._id 
          }, {
            $set: {
              attentions: []
            }
          }),
          UserModel.updateOne({
            _id: attentionUserId 
          }, {
            $set: {
              fans: [
                {
                  timestamps: 100,
                  _id: targetUserId
                }
              ]
            }
          }),
        ])
        .then(_ => {
          return Request
          .get(COMMON_API)
          .query({
            _id: targetUserId.toString(),
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
            expect(target.some(item => item.attention)).to.be.false 
          })
        })
        .then(_ => {
          done()
        })
        .catch(err => {
          done(err)
        })

      })

      it(`get the user attention list and not self and with self info success and self is the fans of attention`, function(done) {

        Promise.all([
          UserModel.updateOne({
            _id: userResult._id 
          }, {
            $set: {
              attentions: [
                {
                  timestamps: 100,
                  _id: attentionUserId
                }
              ]
            }
          }),
          UserModel.updateOne({
            _id: attentionUserId 
          }, {
            $set: {
              fans: [
                {
                  timestamps: 100,
                  _id: targetUserId
                },
                {
                  timestamps: 100,
                  _id: userResult._id 
                }
              ]
            }
          })
        ])
        .then(_ => {
          return Request
          .get(COMMON_API)
          .query({
            _id: targetUserId.toString(),
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
            expect(target.some(item => item.attention)).to.be.true 
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

    describe(`get the user attention list and not self and with self info fail test -> ${COMMON_API}`, function() {

      it(`get the user attention list and not self and with self info fail because the user id is not found`, function(done) {

        const id = targetUserId.toString()

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
          expect(obj.length).to.be.equal(0)
          done()
        })

      })

      it(`get the user attention list and not self and with self info fail because the user id is not verify`, function(done) {
        
        Request
        .get(COMMON_API)
        .query('_id', targetUserId.toString().slice(1))
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
