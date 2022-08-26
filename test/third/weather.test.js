require('module-alias/register')
const { Request } = require('@test/utils')

const COMMON_API = '/api/third/weather'

describe(`${COMMON_API} test`, () => {
  
  describe(`get the weather data success test -> ${COMMON_API}`, function() {

    it(`get the weather data success`, function(done) {

      Request
      .post(COMMON_API)
      .set({
        Accept: 'application/json'
      })
      .send({
        city: '杭州',
      })
      .expect(200)
      .expect('Content-Type', /json/)
      .then(_ => {
        done()
      })
      .catch(err => {
        done(err)
      })

    })

  })

  describe(`get the weather data fail test -> ${COMMON_API}`, function() {

    it(`get weather data fail because the city is not valid`, function(done) {
      Request
      .post(COMMON_API)
      .set({
        Accept: 'application/json'
      })
      .send({
        city: ''
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

  })

})