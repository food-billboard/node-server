const Router = require('@koa/router')
const Language = require('./language')
const Actor = require('./actor')
const District = require('./district')
const Director = require('./director')
const Classify = require('./classify')
const Url = require('url')
const { LanguageModel, ActorModel, DistrictModel, DirectorModel, ClassifyModel, dealErr, responseDataDeal, Params, verifyTokenToData, UserModel, notFound, ROLES_MAP, MOVIE_SOURCE_TYPE } = require('@src/utils')
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

const MEDIA_TYPE = {
  language: LanguageModel,
  actor: ActorModel,
  district: DistrictModel,
  director: DirectorModel,
  classify: ClassifyModel
}

router
.use(async (ctx, next) => {
  const { request: { method, url } } = ctx
  const _method = method.toLowerCase()
  if(_method !== 'delete' && _method !== 'put') return await next()
  let body
  if(_method == 'delete') {
    body = ctx.query
  }else {
    body = ctx.request.body
  }

  const [ _id ] = Params.sanitizers(body, {
    name: '_id',
    sanitizers: [
      data => ObjectId(data)
    ]
  })

  const [, token] = verifyTokenToData(ctx)
  const { mobile } = token

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
        mobile: Number(mobile)
      })
      .select({
        roles: 1
      })
      .exec()
      .then(data => !!data && data._doc)
      .then(notFound),
      model.findOne({
        _id
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
    const { roles: user_roles } = user_data
    const { source: { roles: media_roles }, source_type } = media_data
    let max_user_roles = 99
    let max_media_roles = 99
    user_roles.forEach(role => {
      const curr = ROLES_MAP[role] == undefined ? 100 : ROLES_MAP[role]
      if(curr < max_user_roles) max_user_roles = curr
    })
    media_roles.forEach(role => {
      const curr = ROLES_MAP[role] == undefined ? 100 : ROLES_MAP[role]
      if(curr < max_media_roles) max_media_roles = curr
    })

    let valid = true
    if(source_type === MOVIE_SOURCE_TYPE.ORIGIN) {
      if(max_user_roles > ROLES_MAP.SUPER_ADMIN) valid = false
    }else if(max_user_roles > max_media_roles) {
      valid = false
    }

    if(valid) return

    return Promise.reject({ errMsg: 'forbidden', status: 403 })

  })
  .catch(dealErr(ctx))

  if(!data) return await next()

  responseDataDeal({
    ctx,
    data
  })

})
//get参数校验
.use(async (ctx, next) => {
  const { request: { method } } = ctx
  const _method = method.toLowerCase()
  if(_method !== 'get') return await next()
  const { _id, content } = ctx.query
  if(!ObjectId.isValid(_id) && (typeof content !== 'string' || !content)) {
    const data = dealErr(ctx)({
      errMsg: 'bad request',
      status: 400
    })
    responseDataDeal({
      ctx,
      data
    })
    return
  }
  return await next()
})
.use('/language', Language.routes(), Language.allowedMethods())
.use('/actor', Actor.routes(), Actor.allowedMethods())
.use('/district', District.routes(), District.allowedMethods())
.use('/director', Director.routes(), Director.allowedMethods())
.use('/classify', Classify.routes(), Classify.allowedMethods())

module.exports = router