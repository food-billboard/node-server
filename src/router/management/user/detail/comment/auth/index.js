const { Params, verifyTokenToData, CommentModel, UserModel, rolesAuthMapValidator, dealErr, responseDataDeal, notFound } = require('@src/utils')
const { Types: { ObjectId } } = require('mongoose')

async function Auth(ctx, next) {
  const [ _ids ] = Params.sanitizers(ctx.query, {
    name: '_id',
    sanitizers: [
      data => data.split(',').map(item => ObjectId(item))
    ]
  })

  const [ , token ] = verifyTokenToData(ctx)
  const { id: opUser } = token

  const data = await Promise.all([
    CommentModel.find({
      _id: { $in: _ids }
    })
    .select({
      user_info: 1,
      source_type: 1,
    })
    .populate({
      path: 'user_info',
      select: {
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
  .then(([comment_data, userData]) => {
    const valid = rolesAuthMapValidator({
      userRoles: userData.roles,
      opRoles: comment_data.filter(item => !!item.user_info).map(item => ({ source_type: item.source_type, roles: item.user_info.roles }))
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