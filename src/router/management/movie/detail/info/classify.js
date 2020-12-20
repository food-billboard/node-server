const Router = require('@koa/router')
const { ClassifyModel, UserModel, dealErr, notFound, Params, responseDataDeal, verifyTokenToData, ROLES_MAP, MOVIE_SOURCE_TYPE } = require('@src/utils')
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

const checkParams = (ctx, ...params) => {
  return Params.body(ctx, {
    name: 'name',
    validator: [
      data => typeof data === 'string' && data.length > 0 && data.length < 20
    ]
  }, {
    name: 'icon',
    validator: [
      data => ObjectId.isValid(data)
    ]
  }, ...params)
}

const sanitizersParams = (ctx, ...params) => {
  return Params.sanitizers(ctx.request.body, {
    name: 'icon',
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
  }else if(typeof content === 'string' && !!content){
    query = {
      name: {
        $regex: content,
        $options: 'gi'
      }
    }
  }

  const data = await ClassifyModel.find(query)
  .select({
    _id: 1,
    name: 1,
    icon: 1,
    glance: 1,
    createdAt: 1,
    updatedAt: 1,
    source_type: 1
  })
  .exec()
  .then(data => {

    return {
      data: data.map(item => {
        const { name, icon, glance, createdAt, updatedAt, source_type, _id } = item
        return {
          name,
          glance,
          icon: icon ? icon.src : null,
          _id,
          createdAt,
          updatedAt,
          source_type
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

  const [ icon ] = sanitizersParams(ctx)
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
    const model = new ClassifyModel({
      name,
      icon,
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

  const [ icon, _id ] = sanitizersParams(ctx, {
    name: '_id',
    sanitizers: [
      data => ObjectId(data)
    ]
  })
  const { request: { body: { name } } } = ctx
  
  const data = await ClassifyModel.updateOne({
    _id
  }, {
    $set: {
      name,
      icon
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

  const data = await ClassifyModel.deleteOne({
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