require('module-alias/register')
const { BarrageModel } = require('@src/utils')
const { expect } = require('chai')
const { mockCreateBarrage, Request, commonValidate } = require('@test/utils')
const mongoose = require("mongoose")
const { Types: { ObjectId } } = mongoose

const COMMON_API = '/api/user/barrage'

function responseExpect(res, validate=[]) {
  const { res: { data: target } } = res
         
  expect(target).to.be.a('array')
  target.forEach(item => {
    expect(item).to.be.a('object').and.that.includes.all.keys('hot', 'like', 'time_line', '_id', 'content', 'updatedAt')
    commonValidate.number(item.hot)
    expect(item.like).to.be.a('boolean')
    commonValidate.time(item.time_line)
    commonValidate.objectId(item._id)
    commonValidate.string(item.content)
    commonValidate.time(item.updatedAt)
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

  describe(`get movie barrage list without self info test -> ${COMMON_API}`, function() {

    let database
    const values = {
      origin: new ObjectId('56aa3554e90911b64c36a424'),
      user: new ObjectId('56aa3554e90911b64c36a425'),
      content: COMMON_API
    }

    before(function(done) {
      const { model } = mockCreateBarrage(values)

      database = model

      database.save()
      .then(function(_) {
        done()
      })
      .catch(err => console.error(err))
    })

    after(function(done) {
      BarrageModel.deleteMany({
        content: COMMON_API
      })
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

    })

    describe(`get movie barrage list without self info fail test -> ${COMMON_API}`, function() {
      
      // it(`get movie barrage list without self info fail because the movie id is not verify`, function(done) {
      //   Request
      //   .get(COMMON_API)
      //   .query({ _id: values.origin.toString().slice(1) })
      //   .set('Accept', 'application/json')
      //   .expect('Content-Type', /json/)
      //   .expect(400)
      //   .end(function(err, res) {
      //     if(err) return done(err)
      //     done()
      //   })  
      // })

      it(`get movie barrage list without self info fail because the movie id is not found`, function(done) {

        const id = values.origin.toString()

        Request
        .get(COMMON_API)
        .query({ _id: `${parseInt(id.slice(0, 1)) + 1}${id.slice(1)}` })
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