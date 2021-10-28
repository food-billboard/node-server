require('module-alias/register')
const { mockCreateUser, Request, commonValidate } = require('@test/utils')
const { UserModel } = require('@src/utils')

const COMMON_API = '/api/customer/manage/token'

function responseExpect(res, validate=[]) {

  const { res: { data: target } } = res

  commonValidate.string(target)

  if(Array.isArray(validate)) {
    validate.forEach(valid => {
      typeof valid == 'function' && valid(target)
    })
  }else if(typeof validate == 'function') {
    validate(target)
  }
}

describe(`${COMMON_API} test`, function() {

  let userId
  let selfToken
  let signToken

  before(async function() {

    const { model:self, signToken:getToken } = mockCreateUser({
      username: COMMON_API,
    })

    signToken = getToken

    await self.save()
    .then(self => {
      userId = self._id
      selfToken = signToken(userId)
    })
    .catch(err => {
      console.log('oops: ', err)
    })

    return Promise.resolve()

  })

  after(async function() {

    await UserModel.deleteOne({
      username: COMMON_API
    })
    .catch(err => {
      console.log('oops: ', err)
    })

    return Promise.resolve()

  })

  describe(`get self token test -> ${COMMON_API}`, function() {

    describe(`get self token test success -> ${COMMON_API}`, function() {

      it(`get self token test success`, function(done) {

        Request
        .get(COMMON_API)
        .set({
          Accept: 'Application/json',
          Authorization: `Basic ${selfToken}`
        })
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

  })

})
