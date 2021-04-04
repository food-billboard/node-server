const { Types: { ObjectId } } = require('mongoose')
const Url = require('url')
const { 
  LanguageModel, 
  ActorModel, 
  DistrictModel, 
  DirectorModel, 
  ClassifyModel, 
  dealErr, 
  responseDataDeal, 
  Params, 
  verifyTokenToData, 
  UserModel, 
  notFound, 
  ROLES_MAP, 
  MOVIE_SOURCE_TYPE,
  rolesAuthMapValidator
} = require('@src/utils')

const MEDIA_TYPE = {
  language: LanguageModel,
  actor: ActorModel,
  district: DistrictModel,
  director: DirectorModel,
  classify: ClassifyModel
}

async function Auth(ctx, next) {
  const { request: { method, url } } = ctx
  const _method = method.toLowerCase()
  if(_method !== 'delete' && _method !== 'put') return await next()
  let body
  if(_method == 'delete') {
    body = ctx.query
  }else {
    body = ctx.request.body
  }

  const [ _ids ] = Params.sanitizers(body, {
    name: '_id',
    sanitizers: [
      data => data.split(',').map(item => ObjectId(item.trim()))
    ]
  })

  const [, token] = verifyTokenToData(ctx)
  const { id } = token

  const { pathname } = Url.parse(url)
  const mediaType = pathname.replace(/(\/.+)+\/(?=.+)/, '')
  const model = MEDIA_TYPE[mediaType]
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
      .then(data => !!data && data._doc)
      .then(notFound),
      model.find({
        _id: { $in: _ids }
      })
      .select({
        source: 1,
        source_type: 1
      })
      .populate({
        path: 'source',
        select: {
          roles: 1
        }
      })
      .exec()
      .then(data => !!data && data._doc)
      .then(notFound)
    ])
  })
  .then(([user_data, media_data]) => {
    //获取待操作信息权限及操作用户权限
    const valid = rolesAuthMapValidator({
      userRoles: user_data.roles,
      opRoles: media_data.map(item => {
        const { source: { roles }, source_type } = item
        return {
          source_type,
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