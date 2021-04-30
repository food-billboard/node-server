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
const { RankModel, ClassifyModel, DistrictModel, MovieModel } = require('@src/utils')

const COMMON_API = '/api/user/home/rank'

function responseExpect(res, validate=[]) {
  const { res: { data: target } } = res
         
  expect(target).to.be.a('array')
  target.forEach(item => {
    expect(item).to.be.a('object').and.that.includes.any.keys('icon', 'match', 'name', '_id', 'updatedAt')
    commonValidate.objectId(item._id)
    if(item.icon) {
      commonValidate.poster(item.icon)
    }
    commonValidate.string(item.name)
    commonValidate.date(item.updatedAt)
    expect(item.match).to.be.a('array')
    item.match.forEach(mt => {
      expect(mt).to.be.a('object').and.that.includes.all.keys('name', 'poster', '_id', 'updatedAt')
      commonValidate.string(mt.name)
      commonValidate.poster(mt.poster)
      commonValidate.objectId(mt._id)
      commonValidate.date(mt.updatedAt)
      // commonValidate.string(mt.match_field, function(target) {
      //   return !!~['classify', 'district'].indexOf(target.toLowerCase())
      // })
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

    before(function(done) {

      const { model: classify } = mockCreateClassify({
        name: COMMON_API
      })
      const { model: district } = mockCreateDistrict({
        name: COMMON_API
      })

      Promise.all([
        classify.save(),
        district.save()
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
          name: `${COMMON_API}-classify`,
          match_field: {
            _id: classifyId,
            field: 'classify'
          }
        })
        const { model: districtRank } = mockCreateRank({
          name: `${COMMON_API}-district`,
          match_field: {
            _id: districtId,
            field: 'district'
          }
        })

        return Promise.all([
          movie.save(),
          classifyRank.save(),
          districtRank.save()
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
        MovieModel.deleteMany({
          name: COMMON_API
        }),
        RankModel.deleteMany({
          $or: [
            {
              name: `${COMMON_API}-classify`
            },
            {
              name: `${COMMON_API}-district`
            }
          ]
        }),
        ClassifyModel.deleteOne({
          name: COMMON_API
        }),
        DistrictModel.deleteOne({
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
        .expect('Content-Type', /json/)
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

  })

})