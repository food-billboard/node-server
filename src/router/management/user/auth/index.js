const { Types: { ObjectId } } = require('mongoose')
const { verifyTokenToData, UserModel, rolesAuthMapValidator, responseDataDeal, dealErr } = require('@src/utils')

async function Auth(ctx, next) {
  const { request: { method } } = ctx
  const [ , token ] = verifyTokenToData(ctx)
  const { id: opUserId } = token
  const _method = method.toLowerCase()

  if(_method === 'post') return await next()

  let _id

  try {
    if(_method === 'delete') {
      _id = ctx.query._id
    }else if(_method === 'put') {
      _id = ctx.request.body._id
    }
    _id = _id.split(',').map(item => ObjectId(item))
  }catch(err){}
  

  const data = await UserModel.find({
    _id: { $in: [ ..._id, ObjectId(opUserId) ] }
  })
  .select({
    _id: 1,
    mobile: 1,
    roles: 1
  })
  .exec()
  .then(data => !!data && !! data.length && data)
  .then(notFound)
  .then(data => {
    const { opUser, toOpUsers } = data.reduce((acc, cur) => {
      const { roles, _id } = cur
      if(_id.equals(opUserId)) {
        acc.opUser = roles 
      }else {
        acc.toOpUsers.push({
          roles
        })
      }
      return acc 
    }, {
      opUser: null,
      toOpUsers: []
    })
    const forbidden = rolesAuthMapValidator({
      userRoles: opUser,
      opRoles: toOpUsers
    })

    if(!forbidden) return Promise.reject({ errMsg: 'forbidden', status: 403 })
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