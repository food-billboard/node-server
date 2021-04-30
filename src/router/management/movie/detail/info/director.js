const Router = require('@koa/router')
const { DirectorModel, UserModel, dealErr, notFound, Params, responseDataDeal, verifyTokenToData, ROLES_MAP, MOVIE_SOURCE_TYPE, getWordPinYin } = require('@src/utils')
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

  const [ currPage, pageSize, all ] = Params.sanitizers(ctx.query, {
    name: 'currPage',
    _default: 0,
    sanitizers: [
      data => data >= 0 ? +data : 0
    ]
  }, {
    name: 'pageSize',
    _default: 30,
    sanitizers: [
      data => data >= 0 ? +data : 30
    ]
  }, {
    name: 'all',
    sanitizers: [
      data => data == 1 ? true : false
    ]
  })
  
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

  let aggregate = [
    {
      $match: query,
    },
    ...(all ? [] : [
      {
        $skip: pageSize * currPage
      },
      {
        $limit: pageSize
      }
    ]),
    {
      $lookup: {
        from: 'districts',
        localField: 'country',
        foreignField: '_id',
        as: 'country'
      }
    },
    {
      $unwind: "$country"
    },
    {
      $lookup: {
        from: 'images',
        localField: 'other.avatar',
        foreignField: '_id',
        as: 'avatar'
      }
    },
    {
      $unwind:{
        path:'$avatar',
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $project: {
        _id: 1,
        name: 1,
        createdAt: 1,
        updatedAt: 1,
        source_type: 1,
        another_name: "$other.another_name",
        avatar: "$avatar.src",
        avatar_id: "$avatar._id",
        country: {
          name: "$country.name",
          _id: "$country._id"
        },
        key: 1
      }
    }
  ]

  const data = await Promise.all([
    DirectorModel.aggregate([
      {
        $match: query
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: 1
          }
        }
      }
    ]),
    DirectorModel.aggregate(aggregate)
  ])
  .then(([total, data]) => {
    return {
      data: {
        list: data,
        total: !!total.length ? total[0].total || 0 : 0,
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
.post('/', async(ctx) => {
  
  const check = checkParams(ctx)
  if(check) return

  const [avatar, alias, country] = sanitizersParams(ctx)
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
  .then(notFound)
  .then(data => {
    const { _id, roles } = data
    const model = new DirectorModel({
      name,
      country,
      key: getWordPinYin(name),
      other: {
        another_name: alias || '',
        avatar
      },
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
  
  const data = await DirectorModel.updateOne({
    _id
  }, {
    $set: {
      name,
      key: getWordPinYin(name),
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
  const [ _ids ] = Params.sanitizers(ctx.query, {
    name: '_id',
    sanitizers: [
      data => data.split(',').map(item => ObjectId(item.trim()))
    ]
  })

  const data = await DirectorModel.deleteMany({
    _id: { $in: _ids }
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