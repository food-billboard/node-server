require('module-alias/register')
const { BarrageModel } = require('@src/utils')
const { expect } = require('chai')
const { mockCreateBarrage, Request } = require('@test/utils')
const mongoose = require("mongoose")
const { Types: { ObjectId } } = mongoose

const COMMON_API = '/api/user/barrage'

function responseExpect(res, validate=[]) {
  const { target } = res
         
  expect(target).to.be.a('object').and.include.all.keys('hot', 'like', 'time_line', '_id', 'content')
  expect(target).to.be.have.a.property('hot').and.that.a('number')
  expect(target).to.be.have.a.property('like').and.that.a('boolean')
  expect(target).to.be.have.a.property('time_line').and.that.a('number')
  expect(target).to.be.have.a.property('_id').and.that.a('string')
  expect(target).to.be.have.a.property('content').and.that.a('string')
  if(Array.isArray(validate)) {
    validate.forEach(valid => {
      typeof valid == 'function' && valid(target)
    })
  }else if(typeof validate === 'function') {
    validate(target)
  }
}

describe(`${COMMON_API} test`, function() {

  describe(`get movie barrage list without self info test -> ${COMMON_API}`, function() {

    let database
    const values = {
      origin: new ObjectId('56aa3554e90911b64c36a424'),
      user: new ObjectId('56aa3554e90911b64c36a425')
    }

    before(function(done) {
      database = mockCreateBarrage(values)

      database.save()
      .then(function(_) {
        done()
      })
      .catch(err => console.error(err))
    })

    after(function(done) {
      BarrageModel.deleteOne(values)
      .then(function() {
        done()
      })
    })

    describe(`get movie barrage list without self info success test -> ${COMMON_API}`, function() {

      it(`get movie barrage list without self info success`, function(done) {

        Request
        .get(COMMON_API)
        .query({ _id: values.origin.toString() })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)  
        .end(function(err, res) {
          if(err) return done(err)
          responseExpect(res)
          done()
        })
      })

    })

    describe(`get movie barrage list without self info fail test -> ${COMMON_API}`, function() {
      
      it(`get movie barrage list without self info fail because the movie id is not verify or not found`, function(done) {
        Request
        .get(COMMON_API)
        .query({ _id: values.origin.toString().slice(1) })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(400)
        .end(function(err, res) {
          if(err) return done(err)
          done()
        })  
      })

      it(`get movie barrage list without self info fail because the movie id is not found`, function(done) {
        Request
        .get(COMMON_API)
        .query({ _id: `${parseInt(values.origin.toString().slice(0, 1)) + 1}${values.origin.toString().slice(1)}` })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function(err, res) {
          if(err) return done(err)
          const { res: { text } } = res
          let obj
          try{
            obj = JSON.parse(text)
          }catch(_) {
            console.log(_)
          }
          expect(obj.res.data.length).to.be.equal(0)
          done()
        })  
      })

    })

  })

})