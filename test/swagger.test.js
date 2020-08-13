const App = require('../app')
const path = require('path')
const Request = require('supertest').agent(App.listen())
const { assert } = require('chai')

const COMMON_API = '/api/swagger'

describe('/api/swagger/:name -> static api doc test', function() {

  describe('success', function() {

    it('html-file success test', function(done) {
      Request
      .get(path.resolve(COMMON_API, 'index.html'))
      .expect(200)
      .end(function(err, res) {
        if(err) {
          done(err)
        }else {
          const { header, text } = res

          done()
        }
      })
    })

    it('css-file success test', function(done) {

    })

    it('javascript-file success test', function(done) {

    })

  })

  describe('fail test', function() {

    it('html-file fail test', function(done) {

    })

    it('css-file fail test', function(done) {

    })

    it('javascript-file fail test', function(done) {

    })

  })

})