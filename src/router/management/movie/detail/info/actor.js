const Router = require('@koa/router')
const { ActorModel, dealErr, notFound, Params, responseDataDeal, verifyTokenToData, ROLES_MAP, MOVIE_SOURCE_TYPE, UserModel } = require('@src/utils')
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

const checkParams = (ctx, ...params) => {
  return Params.body(ctx, {
    name: 'name',
    validator: [
      data => typeof data === 'string' && data.length > 0 && data.length < 20
    ]
  }, {
    name: 'avatar',
    validator: [
      data => ObjectId.isValid(data)
    ]
  }, {
    name: 'country',
    validator: [
      data => ObjectId.isValid(data)
    ]
  }, ...params)
}

const sanitizersParams = (ctx, ...params) => {
  return Params.sanitizers(ctx.request.body, {
    name: 'avatar',
    sanitizers: [  
      data => ObjectId(data)
    ]
  }, {
    name: 'alias',
    sanitizers: [
      data => typeof data === 'string' && !!data.length ? data : undefined
    ]
  }, {
    name: 'country',
    sanitizers: [
      data => ObjectId(data)
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

  const data = await ActorModel.find(query)
  .select({
    _id: 1,
    other: 1,
    name: 1,
    createdAt: 1,
    updatedAt: 1,
    source_type: 1,
    country: 1
  })
  .populate({
    path: 'country',
    select: {
      name: 1,
      _id: 1
    }
  })
  .exec()
  .then(data => {

    return {
      data: data.map(item => {
        const { name, other: { another_name, avatar }, createdAt, country, updatedAt, source_type, _id } = item
        return {
          name,
          another_name,
          avatar: avatar ? avatar.src : null,
          _id,
          createdAt,
          updatedAt,
          source_type,
          country
        }
      })
    }
  })
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

  const [avatar, alias, country] = sanitizersParams(ctx)
  const { request: { body: { name } } } = ctx

  const [, token] = verifyTokenToData(ctx)
  const { mobile } = token

  const data = await UserModel.findOne({
    mobile: Number(mobile)
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
    const model = new ActorModel({
      name,
      other: {
        another_name: alias || '',
        avatar
      },
      country,
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

  const [ avatar, alias, country, _id ] = sanitizersParams(ctx, {
    name: '_id',
    sanitizers: [
      data => ObjectId(data)
    ]
  })
  const { request: { body: { name } } } = ctx
  
  const data = await ActorModel.updateOne({
    _id
  }, {
    $set: {
      name,
      country,
      "other.avatar": avatar,
      ...(alias ? { "other.another_name": alias } : {})
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

  const data = await ActorModel.deleteOne({
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