const { Types: { ObjectId } } = require('mongoose')
const { Params, verifyTokenToData, FeedbackModel, UserModel, rolesAuthMapValidator, responseDataDeal, dealErr, notFound } = require('@src/utils')

async function Auth(ctx, next) {

  const check = Params.query(ctx, {
    name: '_id',
    validator: [
      data => data.split(',').every(item => ObjectId.isValid(item))
    ]
  })
  if(check) return 

  const [ _ids ] = Params.sanitizers(ctx.query, {
    name: '_id',
    sanitizers: [
      data => data.split(',').map(item => ObjectId(item))
    ]
  })

  const [ , token ] = verifyTokenToData(ctx)
  const { id: opUser } = token

  const data = await Promise.all([
    FeedbackModel.find({
      _id: { $in: _ids }
    })
    .select({
      user_info: 1,
      _id: 0
    })
    .populate({
      path: 'user_info',
      select: {
        _id: 0,
        roles: 1
      }
    })
    .exec()
    .then(data => !!data && !!data.length && data)
    .then(notFound),
    UserModel.findOne({
      _id: ObjectId(opUser)
    })
    .select({
      roles: 1
    })
    .exec()
    .then(notFound)
  ])
  .then(([feedback_data, user_data]) => {
    const valid = rolesAuthMapValidator({
      userRoles: user_data.roles,
      opRoles: feedback_data.map(item => ({ roles: item.user_info.roles }))
    })

    return valid
  })
  .then(valid => {
    if(!valid) return Promise.reject({ errMsg: 'forbidden', status: 403 })
    return
  })
  .catch(dealErr(ctx))

  if(!data) return await next()

  responseDataDeal({
    ctx, 
    data,
    needCache: false
  })
}

module.exports = {
  Auth
}