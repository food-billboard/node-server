const { UserModel, MovieModel, encoded, signToken } = require('@src/utils')
const { Model } = require('mongoose')
const { MovieModel } = require('../src/utils/mongodb/mongo.lib')

//用户创建
function mockCreateUser() {
  const password = '1234567890'
  const mobile = 18368003190
  const encodedPwd = encoded(password)
  const token = signToken({ mobile, password: encodedPwd })
  return {
    password,
    mobile,
    token,
    beforeEach: function(done) {
      const model = new UserModel({
        mobile,
        password: encodedPwd
      })
      model
      .save()
      .then(done)
    },
    afterEach: function(done) {
      UserModel.remove({ mobile })
    }
  }
}

//电影创建
function mockCreateMovie() {
  const model = new MovieModel()
}

module.exports = {
  mockCreateUser
}