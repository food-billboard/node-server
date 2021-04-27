const { Types: { ObjectId } } = require('mongoose')
const { 
  ImageModel, 
  VideoModel, 
  OtherMediaModel, 
  dealErr, 
  responseDataDeal, 
  Params, 
  verifyTokenToData, 
  UserModel, 
  notFound, 
  rolesAuthMapValidator
} = require('@src/utils')

const MEDIA_TYPE = {
  0: ImageModel,
  1: VideoModel,
  2: OtherMediaModel,
}

async function Auth(ctx, next) {
  const { request: { method } } = ctx
  const _method = method.toLowerCase()
  if(_method !== 'delete' && _method !== 'put') return await next()
  let body
  if(_method == 'delete') {
    body = ctx.query
  }else {
    body = ctx.request.body
  }

  const [ _ids, model ] = Params.sanitizers(body, {
    name: '_id',
    sanitizers: [
      data => data.split(',').map(item => ObjectId(item.trim()))
    ]
  }, {
    name: 'type',
    sanitizers: [
      data => MEDIA_TYPE[data]
    ]
  })

  const [, token] = verifyTokenToData(ctx)
  const { id } = token

  const data = await new Promise((resolve, reject) => {
    if(!model || !body) return reject({ errMsg: 'bad request', status: 400 })
    resolve()
  })
  .then(_ => {
    return Promise.all([
      UserModel.findOne({
        _id: ObjectId(id)
      })
      .select({
        roles: 1
      })
      .exec()
      .then(notFound),
      model.find({
        _id: { $in: _ids }
      })
      .select({
        origin: 1,
        origin_type: 1
      })
      .populate({
        path: 'origin',
        select: {
          roles: 1
        }
      })
      .exec()
      .then(data => !!data && !!data.length && data)
      .then(notFound)
    ])
  })
  .then(([user_data, media_data]) => {
    //获取待操作信息权限及操作用户权限
    const valid = rolesAuthMapValidator({
      userRoles: user_data.roles,
      opRoles: media_data.map(item => {
        const { origin: { roles }, origin_type } = item
        return {
          source_type: origin_type,
          roles
        }
      })
    })
    if(valid) return
    return Promise.reject({ errMsg: 'forbidden', status: 403 })
  })
  .catch(dealErr(ctx))

  if(!data) return await next()

  responseDataDeal({
    ctx,
    data
  })
}

module.exports = {
  Auth
}