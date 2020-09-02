require('module-alias/register')
const { mockCreateUser, Request } = require('@test/utils')
const { verifyTokenToData, UserModel } = require('@src/utils')

const COMMON_API = '/api/user/logon/signout'

describe(`${COMMON_API} test`, function() {

  describe(`post for logout test -> ${COMMON_API}`, function() {

    let database
    let another
    let result

    before(function(done) {
      const { model, ...nextData } = mockCreateUser({
        username: COMMON_API
      })
      another = nextData
      database = model
      database.save()
      .then(function(data) {
        result = data
        done()
      })
      .catch(err => {
        console.log('oops: ', err)
      })
    })

    after(function(done) {
      database.deleteOne({
        username: COMMON_API
      })
      .then(function() {
        done()
      })
      .catch(err => {
        console.log('oops: ', err)
      })
    })
    
    describe(`post for logout success test -> ${COMMON_API}`, function() {

      it(`post for logout success`, function(done) {

        Request
        .post(COMMON_API)
        .set({ 
          Accept: 'Application/json',
          Authorization: `Basic ${another.token}`
        })
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

    })

    describe(`post for logout fail test -> ${COMMON_API}`, function() {

      it(`post for logout fail because the token is not verify`, function(done) {
        
        Request
        .post(COMMON_API)
        .set({
          Accept: 'Application/json',
        })
        .expect(401)
        .expect('Content-Type', /json/)
        .end(function(err, _) {
          if(err) return done(err)
          done()
        })

      })

    })

  })

})