const { Types: { ObjectId } } = require('mongoose')
const { 
  rolesAuthMapValidator,
  verifyTokenToData,
  MovieModel,
  UserModel,
  dealErr,
  responseDataDeal
} = require('@src/utils')

async function Auth(ctx, next) {
  const { request: { method } } = ctx
  const _method = method.toLowerCase()

  if(_method === 'post' || _method === 'get') return await next()

  const [ , token ] = verifyTokenToData(ctx)
  const { id: opUserId } = token

  let _id

  try {
    _id = _method == 'put' ? ctx.request.body._id : ctx.query._id
  }catch(err) {}

  function formatId(id) {
    if(!id) return Promise.reject({ errMsg: 'bad request', status: 400 })
    let ids = id.split(',')
    const prevLen = ids.length
    ids = ids.filter(item => ObjectId.isValid(item))
    if(prevLen !== ids.length) return Promise.reject({ errMsg: 'bad request', status: 400 })
    return Promise.resolve(ids.map(item => ObjectId(item)))
  }

  const data = await formatId(_id)
  .then(ids => {
    return Promise.all([
      MovieModel.find({
        _id: { $in: ids }
      })
      .select({
        source_type: 1,
        author: 1
      })
      .populate({
        path: "author",
        select: {
          roles: 1,
          _id: 1
        }
      })
      .exec(),
      UserModel.findOne({
        _id: ObjectId(opUserId)
      })
      .select({
        _id: 1,
        roles: 1
      })
      .exec()
    ])
  })
  .then(([movieData, userData]) => {
    const valid = rolesAuthMapValidator({
      userRoles: userData.roles,
      opRoles: movieData.filter(item => !!item.author).map(item => ({ source_type: item.source_type, roles: item.author.roles }))
    })
    return valid
  })
  .then(data => {
    if(!data) return Promise.reject({ errMsg: 'forbidden', status: 403 })
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