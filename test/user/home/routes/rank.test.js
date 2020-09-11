require('module-alias/register')
const { expect } = require('chai')
const { 
  mockCreateRank, 
  mockCreateClassify,
  mockCreateDistrict,
  mockCreateMovie,
  Request, 
  commonValidate 
} = require('@test/utils')
const mongoose = require('mongoose')
const { Types: { ObjectId } } = mongoose

const COMMON_API = '/api/user/home/rank'

function responseExpect(res, validate=[]) {
  const { res: { data: target } } = res
         
  expect(target).to.be.a('array')
  target.forEach(item => {
    expect(item).to.be.a('object').and.that.includes.all.keys('icon', 'match_field', 'match', 'name', '_id')

    commonValidate.objectId(item._id)
    commonValidate.poster(item.icon)
    commonValidate.string(item.name)
    commonValidate.string(item.match_field, function(target) {
      return ['classify', 'district'].indexOf(target.toLowerCase())
    })

    expect(item.match).to.be.a('array')
    item.match.forEach(mt => {
      expect(mt).to.be.a('object').and.that.includes.all.keys('name', 'poster', '_id')
      commonValidate.string(mt.name)
      commonValidate.poster(mt.poster)
      commonValidate.objectId(mt._id)
    })

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

  describe(`get home rank list test -> ${COMMON_API}`, function() {

    let movieDatabase
    let rankClassifyDatabase
    let rankDistrictDatabase
    let classifyDatabase
    let districtDatabase

    before(function(done) {

      const { model: classify } = mockCreateClassify({
        name: COMMON_API
      })
      const { model: district } = mockCreateDistrict({
        name: COMMON_API
      })

      classifyDatabase = classify
      districtDatabase = district

      Promise.all([
        classifyDatabase.save(),
        districtDatabase.save()
      ])
      .then(([classify, district]) => {
        const classifyId = classify._id
        const districtId = district._id

        const { model: movie } = mockCreateMovie({
          name: COMMON_API,
          info: {
            classify: [ classifyId ],
            districtId: [ districtId ]
          }
        })
        const { model: classifyRank } = mockCreateRank({
          name: COMMON_API,
          match_field: {
            _id: classifyId,
            field: 'classify'
          }
        })
        const { model: districtRank } = mockCreateRank({
          name: COMMON_API,
          match_field: {
            _id: districtId,
            field: 'district'
          }
        })

        movieDatabase = movie
        rankClassifyDatabase = classifyRank
        rankDistrictDatabase = districtRank

        return Promise.all([
          movieDatabase.save(),
          rankClassifyDatabase.save(),
          rankDistrictDatabase.save()
        ])

      })
      .then(function() {
        done()
      })
      .catch(err => {
        console.log('oops: ', err)
      })

    })

    after(function(done) {

      Promise.all([
        movieDatabase.deleteOne({
          name: COMMON_API
        }),
        rankClassifyDatabase.deleteOne({
          name: COMMON_API
        }),
        rankDistrictDatabase.deleteOne({
          name: COMMON_API
        }),
        classifyDatabase.deleteOne({
          name: COMMON_API
        }),
        districtDatabase.deleteOne({
          name: COMMON_API
        }),
      ])
      .then(function() {
        done()
      })
      .catch(err => {
        console.log('oops: ', err)
      })

    })

    describe(`get home rank list success test -> ${COMMON_API}`, function() {

      it(`get home rank list success`, function(done) {
        
        Request
        .get(COMMON_API)
        .set({
          Accept: 'Application/json',
        })
        .expect(200)
        .expect({
          'Content-Type': /json/,
        })
        .end(function(err, _) {
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

  })

})