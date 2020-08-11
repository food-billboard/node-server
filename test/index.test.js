require('co-mocha');
require('module-alias/register')
const App = require('../app')
const Request = require('co-supertest').agent(App.listen())
const Should = require('chai').should()
const Router = require('@koa/router')

process.env.NODE_ENV = 'test'
// process.env.DATABASE = 'mongodb://localhost'

describe('APP entry', function * () {
  it('test', function * () {
    const router = new Router()
    router.get('/api/swagger/index.html')
    
    var res = yield Request
        .get('/api/swagger/index.html')
        .expect(200)
        .end();

      console.log(res)
  })
})
