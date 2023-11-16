require('module-alias/register')
const { expect } = require('chai')
const { UserModel } = require('@src/utils')
const { scheduleMethod } = require("@src/utils/schedule/create-admin/index.schedule")

describe(`schedule of initial admin test`, function() {

  before(function(done) {
    UserModel.find({})
    .select({
      _id: 1
    })
    .exec()
    .then(data => {
      return UserModel.deleteMany({
        _id: {
          $in: data 
        }
      })
    })
    .then(_ => {
      done()
    })
    .catch(err => {
      done(err)
    })

  })

  after(function(done) {
    UserModel.deleteMany({
      mobile: '18358995425'
    })
    .then(_ => {
      done()
    })
    .catch(err => {
      done(err)
    })
  })

  it(`initial admin`, function(done) {

    scheduleMethod({
      test: true 
    })
    .then(_ => {
      return UserModel.find({
        mobile: '18358995425'
      })
      .select({
        _id: 1
      })
      .exec()
    })
    .then(data => {
      expect(!!data.length).to.be.true 
    })
    .then(_ => {
      done()
    })
    .catch(err => {
      done(err)
    })

  })

})

