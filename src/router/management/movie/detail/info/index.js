const Router = require('@koa/router')
const Language = require('./language')
const Actor = require('./actor')
const District = require('./district')
const Director = require('./director')
const Classify = require('./classify')
const Url = require('url')
const { LanguageModel, ActorModel, DistrictModel, DirectorModel, ClassifyModel, dealErr, responseDataDeal, Params, verifyTokenToData } = require('@src/utils')
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
    body = 'query'
  }else {
    body = 'body'
  }

  const [ _id ] = Params.sanitizers(ctx[body], {
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
    return model.findOne({
      _id
    })
    .select({

    })
  })
  .catch(dealErr(ctx))

  if(!data) return await next()

  responseDataDeal({
    ctx,
    data
  })

})
.use('/language', Language.routes(), Language.allowedMethods())
.use('/actor', Actor.routes(), Actor.allowedMethods())
.use('/district', District.routes(), District.allowedMethods())
.use('/director', Director.routes(), Director.allowedMethods())
.use('/classify', Classify.routes(), Classify.allowedMethods())

module.exports = router