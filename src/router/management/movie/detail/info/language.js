const Router = require('@koa/router')
const { LanguageModel, UserModel, dealErr, notFound, Params, responseDataDeal, verifyTokenToData, ROLES_MAP, MOVIE_SOURCE_TYPE } = require('@src/utils')
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

const checkParams = (ctx, ...params) => {
  return Params.body(ctx, {
    name: 'name',
    validator: [
      data => typeof data === 'string' && data.length > 0 && data.length < 20
    ]
  }, ...params)
}

router
.get('/', async(ctx) => {

  const { _id, content } = ctx.query
  let query = {}
  if(ObjectId.isValid(_id)) {
    query = {
      _id: ObjectId(_id)
    }
  }else {
    query = {
      name: {
        $regex: content,
        $options: 'gi'
      }
    }
  }

  const data = await LanguageModel.find(query)
  .select({
    _id: 1,
    name: 1,
    createdAt: 1,
    updatedAt: 1,
    source_type: 1
  })
  .exec()
  .then(data => ({ data }))
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data,
    needCache: false
  })

})
.post('/', async(ctx) => {
  
  const check = checkParams(ctx)
  if(check) return

  const { request: { body: { name } } } = ctx

  const [, token] = verifyTokenToData(ctx)
  const { id } = token

  const data = await UserModel.findOne({
    _id: ObjectId(id)
  })
  .select({
    _id: 1,
    roles: 1
  })
  .exec()
  .then(data => !!data && data._doc)
  .then(notFound)
  .then(data => {
    const { _id, roles } = data
    const model = new LanguageModel({
      name,
      source_type: roles.some(role => ROLES_MAP[role] === ROLES_MAP.SUPER_ADMIN) ? MOVIE_SOURCE_TYPE.ORIGIN : MOVIE_SOURCE_TYPE.USER,
      source: _id
    })
    return model.save()
  })
  .then(data => {
    if(!data) return Promise.reject({ errMsg: 'unknown error', status: 500 })

    return {
      data: {
        data: data._id
      }
    }
  })
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data,
    needCache: false
  })

})
.put('/', async(ctx) => {
  
  const check = checkParams(ctx)
  if(check) return

  const [ _id ] = Params.sanitizers(ctx.request.body, {
    name: '_id',
    sanitizers: [
      data => ObjectId(data)
    ]
  })

  const { request: { body: { name } } } = ctx
  
  const data = await LanguageModel.updateOne({
    _id
  }, {
    $set: {
      name
    }
  })
  .then(data => {
    if(data.nModified == 0) return Promise.reject({ errMsg: 'not found', status: 404 })

    return {
      data: {
        data: null
      }
    }
  })
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data,
    needCache: false
  })

})
.delete('/', async(ctx) => {
  
  const [ _id ] = Params.sanitizers(ctx.query, {
    name: '_id',
    sanitizers: [
      data => ObjectId(data)
    ]
  })

  const data = await LanguageModel.deleteOne({
    _id
  })
  .then(data => {
    if(data.deletedCount == 0) return Promise.reject({ errMsg: 'not found', status: 404 })
    return {
      data: {
        data: null
      }
    }
  })
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data,
    needCache: false
  })

})

module.exports = router