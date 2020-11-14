require('module-alias/register')
const App = require('../app')
const Request = require('supertest').agent(App.listen())
const should = require('chai').should()
const assert = require('chai').assert
const path = require('path')

process.env.NODE_ENV = 'test'
process.env.DATABASE = 'mongodb://localhost'

describe('APP', async function () {
  it('server is complete run in port 4000', function (done) {
      done()
  })
})
