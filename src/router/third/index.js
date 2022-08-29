const Router = require('@koa/router')
const axios = require('axios')
const { get } = require('lodash')
const { Types: { ObjectId } } = require('mongoose')
const { notFound, dealErr, Params, responseDataDeal, ThirdPartyModel, verifyTokenToData, THIRD_PARTY_REQUEST_METHOD, THIRD_PARTY_REQUEST_PARAMS_TYPE, loginAuthorization } = require('@src/utils')

const router = new Router()

const filterParams = (params) => {
  return params.filter(item => {
    const { name, data_type, children } = item 
    return !!name && !!THIRD_PARTY_REQUEST_PARAMS_TYPE[data_type] && ((data_type === THIRD_PARTY_REQUEST_PARAMS_TYPE.object || data_type === THIRD_PARTY_REQUEST_PARAMS_TYPE['normal-array'] || data_type === THIRD_PARTY_REQUEST_PARAMS_TYPE['object-array']) ? Array.isArray(children) : true)
  })
}

router
.post('/request', async (ctx) => {

  const check = Params.body(ctx, {
    name: '_id',
    validator: [
      data => ObjectId.isValid(data)
    ]
  })

  if(check) return 

  const { _id, params: realData } = ctx.request.body

  const data = await ThirdPartyModel.findOne({
    _id,
  })
  .select({
    url: 1,
    method: 1,
    params: 1,
    headers: 1,
    getter: 1
  })
  .exec()
  .then(notFound)
  .then(data => {
    const { url, method, params, headers, getter } = data 
    const paramsMap = {
      post: 'data',
      put: 'data',
      delete: 'query',
      get: 'query'
    }
    const format = (params, value={}) => {
      if(!params) return 
      return params.reduce((acc, cur) => {
        const { name, data_type, children, default_value } = cur 
        if(data_type === THIRD_PARTY_REQUEST_PARAMS_TYPE['normal-array']) {
          acc[name] = (Array.isArray(value[name]) ? value[name] : []).map((item) => {
            return item 
          })
        }else if(data_type === THIRD_PARTY_REQUEST_PARAMS_TYPE['object-array']) {
          acc[name] = (Array.isArray(value[name]) ? value[name] : []).map((item) => {
            return format(children, item)
          })
        }else if(data_type === THIRD_PARTY_REQUEST_PARAMS_TYPE.object) {
          acc[name] = format(children, value[name]) || children 
        }else {
          acc[name] = value[name] || default_value
        }
        return acc 
      }, {})
    }
    return axios[method.toLowerCase()](url, {
      headers: JSON.parse(headers || "{}"),
      [paramsMap[method.toLowerCase()]]: format(params, realData)
    })
    .then(data => {
      return getter ? get(data.data, getter) : data.data 
    })
  })
  .then(data => {
    return {
      data 
    }
  })
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data,
    needCache: false
  })
  

})
//登录判断
.use(loginAuthorization())
.get('/', async (ctx) => {

  const { currPage, pageSize, content } = Params.sanitizers(ctx.query, {
    name: 'currPage',
    _default: 0,
    sanitizers: [
      data => ({
        done: true,
        data: data >= 0 ? +data : 0
      })
    ]
  }, {
    name: 'pageSize',
    _default: 30,
    sanitizers: [
      data => ({
        done: true,
        data: data >= 0 ? +data : 30
      })
    ]
  }, {
    name: 'content',
    sanitizers: [
      data => {
        if(typeof data === 'string' && !!data.length) {

          function reg(content) {
            return {
              $regex: content,
              $options: 'gi'
            }
          }

          let filter = [
            {
              name: reg(data)
            },
            {
              description: reg(data)
            },
            {
              url: reg(data)
            },
            {
              method: reg(data)
            },
          ]
          if(ObjectId.isValid(data)) filter.push(            {
            origin: ObjectId(data)
          })

          return {
            done: true,
            data: {
              $or: filter
            }
          }
        }
        return {
          done: false 
        }
      }
    ]
  }, true)

  const data = await Promise.all([
    ThirdPartyModel.aggregate([
      {
        $match: {
          ...content
        }
      },
      {
        $project: {
          _id: 1
        }
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
    ThirdPartyModel.aggregate([
      {
        $match: {
          ...content
        }
      },
      {
        $skip: currPage * pageSize
      },
      {
        $limit: pageSize
      },
      {
        $lookup: {
          from: 'users', 
          let: { user_id: "$user" },
          pipeline: [  
            {
              $match: {
                $expr: {
                  "$eq": [ "$_id", "$$user_id" ]
                },
              }
            },
            {
              $lookup: {
                from: 'images',
                as: 'avatar',
                foreignField: "_id",
                localField: "avatar"
              }
            },
            {
              $unwind: {
                path: "$avatar",
                preserveNullAndEmptyArrays: true 
              }
            },
            {
              $project: {
                _id: 1,
                avatar: "$avatar.src",
                username: 1,
              }
            }
          ],
          as: 'user',
        }
      },
      {
        $unwind: {
          path: "$user",
          preserveNullAndEmptyArrays: true 
        }
      },
      {
        $project: {
          _id: 1,
          user: {
            _id: "$user._id",
            avatar: "$user.avatar",
            username: "$user.username"
          },
          name: 1,
          description: 1,
          url: 1,
          method: 1,
          params: 1,
          createdAt: 1,
          updatedAt: 1,
          headers: 1,
          getter: 1,
          example: 1,
        }
      }
    ])
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
    data
  })

})
.use(async (ctx, next) => {
  const method = ctx.request.method.toLowerCase() 
  const map = {
    delete: 'query',
    get: 'query',
    post: 'body',
    put: 'body'
  }

  if(method === 'post') return next() 

  const check = Params[map[method]](ctx, {
    name: '_id',
    validator: [
      data => ObjectId.isValid(data)
    ]
  })

  if(check) return 

  return next() 

})
.delete('/', async (ctx) => {

  const { _id } = ctx.query

  const [,token] = verifyTokenToData(ctx)
  const { id } = token 

  const data = await ThirdPartyModel.deleteOne({
    _id: ObjectId(_id),
    user: ObjectId(id)
  })
  .then(data => {
    if(data && data.deletedCount == 0) return Promise.reject({ errMsg: 'forbidden', status: 404 })

    return {
      data: _id 
    }
  })
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data
  })

})
.use(async (ctx, next) => {

  const check = Params.body(ctx, {
    name: 'name',
    validator: [
      data => typeof data === 'string' && data.length >= 2 && data.length <= 20
    ]
  }, {
    name: 'url',
    validator: [
      data => !!data && typeof data === 'string'
    ]
  }, {
    name: 'method',
    validator: [
      data => !!THIRD_PARTY_REQUEST_METHOD[data.toUpperCase()]
    ]
  })

  if(check) return 

  return next() 

})
.post('/', async (ctx) => {

  const { name, description, params=[], url, method, headers='', getter='', example='' } = ctx.request.body

  const [,token] = verifyTokenToData(ctx)
  const { id } = token 

  const model = new ThirdPartyModel({
    name,
    description,
    url,
    method: method.toUpperCase(),
    user: ObjectId(id),
    params: filterParams(params),
    headers,
    getter,
    example
  })

  const data = await model.save()
  .then(data => ({ data: { _id: data._id } }))
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data,
    needCache: false
  })

})
.put('/', async (ctx) => {

  const { name, description, params=[], url, method, _id, headers='', getter, example } = ctx.request.body

  const [,token] = verifyTokenToData(ctx)
  const { id } = token 

  const data = await ThirdPartyModel.updateOne({
    _id: ObjectId(_id),
    user: ObjectId(id)
  }, {
    $set: {
      name, 
      description, 
      params: filterParams(params), 
      url, 
      method,
      headers,
      getter,
      example
    }
  })
  .then(data => {
    if(data && data.nModified != 1) return Promise.reject({ status: 404, errMsg: 'not found' })
    return _id
  })
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data,
    needCache: false
  })


})
// .use('/weather', Weather.routes(), Weather.allowedMethods())

module.exports = router