const Router = require('@koa/router')
const Validator = require('validator')
const Url = require('url')
const pick = require('lodash/pick')
const { Types: { ObjectId } } = require('mongoose')
const {
  verifyTokenToData,
  responseDataDeal,
  dealErr,
  Params,
  VideoModel,
  ImageModel,
  OtherMediaModel,
  UserModel,
  notFound,
  MEDIA_STATUS,
  MEDIA_AUTH,
  parseUrl,
  getClient,
  sleep
} = require('@src/utils')
const { headRequestDeal, patchRequestDeal, postMediaDeal, postRequestDeal } = require('./utils')

const models = [ImageModel, VideoModel, OtherMediaModel]

const router = new Router()

const MAX_FILE_SIZE = 1024 * 1024 * 6

//元数据验证获取
const METADATA = {
  'md5': {
    validator: data => Validator.isMD5(data),
    sanitizers: data => data
  },
  'auth': {
    validator: data => Object.keys(MEDIA_AUTH).includes(data),
    sanitizers: data => data.toUpperCase()
  },
  'chunk': {
    validator: data => {
      const _data = parseInt(data)
      return typeof _data === 'number' && _data > 0
    },
    sanitizers: data => parseInt(data)
  },
  'mime': {
    validator: data => !!Validator.isMimeType(data),
    sanitizers: data => data.toLowerCase()
  },
  'size': {
    validator: data => {
      const _data = parseInt(data)
      return typeof _data === 'number' && _data > 0 && _data <= MAX_FILE_SIZE * 400
    },
    sanitizers: data => parseInt(data)
  },
  'name': {
    validator: () => true,
    sanitizers: data => data.slice(0, 20)
  },
  'file_name': {
    validator: () => true,
    sanitizers: data => data.slice(0, 20)
  },
  'description': {
    validator: () => true,
    sanitizers: data => data.slice(0, 100)
  }
}

async function postFile(deal, ctx) {

  // ? 新增一个特殊逻辑
  //** 
  // 因为本地服务器性能问题，导致大文件通过分片上传后，合并的时间过长，出现408的情况，暂时通过手动控制进度的方式来避免出现超时
  // 当文件分片完成时，分片合并的过程不再影响响应结果，并将分片的md5存储在redis当中，比如当前分片的合并进度情况，用于告知前端
  // 并刻意将结果更改为剩余最后分片offset，则前端会继续发送patch请求
  // 而前端发送的后面的请求，都会优先在redis中寻找是否存在记录，若存在，则直接返回，返回结果依旧如前面所述的数据，直至完成文件合并
  // tips redis需要设置过期时间
  // */

  const { request: { headers } } = ctx

  const metadataKey = Object.keys(pick(METADATA, ['md5']))

  const check = Params.headers(ctx, {
    name: 'upload-offset',
    validator: [
      data => {
        const _data = parseInt(data)
        return !Number.isNaN(_data) && _data >= 0
      }
    ]
  }, {
    name: 'upload-metadata',
    validator: [
      data => {
        if (!data) return false
        return (data.endsWith(',') ? data.slice(0, -1) : data).split(',').every(d => {
          const [key, value] = d.split(' ')
          const index = metadataKey.indexOf(key)
          if (!~index) return true
          if (!!~index) metadataKey.splice(index, 1)
          return METADATA[key].validator(Buffer.from(value, 'base64').toString())
        })
      }
    ]
  })

  if (check || !!metadataKey.length) return

  const [, token] = verifyTokenToData(ctx)
  const { id: _id } = token

  const [metadata, offset] = Params.sanitizers(headers, {
    name: 'upload-metadata',
    sanitizers: [
      data => {
        return data.split(',').reduce((acc, cur) => {
          const [key, value] = cur.split(' ')
          acc[key] = Buffer.from(value, 'base64').toString()
          return acc
        }, {})
      }
    ]
  }, {
    name: 'upload-offset',
    sanitizers: [
      data => parseInt(data)
    ]
  })

  // 查询当前文件是否存在合并情况
  const redisClient = getClient()
  const { md5 } = metadata

  try {
    const data = await new Promise((resolve, reject) => {
      redisClient.get(md5, (err, data) => {
        if (err || !data) {
          reject({
            errMsg: err,
            status: 500
          })
        } else {
          const { current, total, size } = JSON.parse(data)
          resolve({
            'Upload-Offset': current === total ? size : headers['upload-offset'],
            'Upload-Merge-Offset': current,
            'Upload-Merge-Total': total
          })
        }
      })
    })
    // 避免过快请求
    await sleep(4000)
    ctx.set(data)

    ctx.status = 204
    return
  } catch (err) {

  }

  const length = headers['content-length']

  const data = await UserModel.findOne({
    _id: ObjectId(_id)
  })
    .select({
      roles: 1
    })
    .exec()
    .then(notFound)
    .then(data => deal({
      user: data,
      ctx,
      metadata: {
        ...metadata,
        offset,
        length
      }
    }))
    .catch(err => {
      return false
    })

  if (!data) return ctx.status = 500

  const { status, success, offset: nextOffset, isLargeFile, complete } = data

  const responseHeaders = {
    'Upload-Offset': nextOffset
  }
  if (isLargeFile && complete) {
    responseHeaders['Upload-Merge-Offset'] = 0
    responseHeaders['Upload-Offset'] = nextOffset - 1
  }

  //设置响应头
  ctx.set(responseHeaders)

  ctx.status = status
}

router
  .use(async (ctx, next) => {
    const [, token] = verifyTokenToData(ctx)
    if (!token) {
      const data = dealErr(ctx)({ errMsg: 'forbidden', status: 403 })
      responseDataDeal({
        ctx,
        data,
        needCache: false
      })
      return
    }
    return await next()
  })
  .use(async (ctx, next) => {

    const { request: { headers } } = ctx
    const contentLength = headers['content-length'] || headers['Content-Length']

    if (contentLength >= MAX_FILE_SIZE) {
      responseDataDeal({
        ctx,
        data: dealErr(ctx)({ errMsg: 'request to large', status: 413 }),
        needCache: false
      })
      return
    }

    return await next()

  })
  //断点续传预查
  .head('/', async (ctx) => {

    const { request: { headers } } = ctx

    const metadataKey = Object.keys(pick(METADATA, ['md5', 'auth', 'chunk', 'mime', 'size']))

    const check = Params.headers(ctx, {
      name: 'tus-resumable',
      validator: [
        data => {
          return data === '1.0.0'
        }
      ]
    }, {
      name: 'upload-metadata',
      validator: [
        data => {
          if (!data) return false
          return (data.endsWith(',') ? data.slice(0, -1) : data).split(',').every(d => {
            const [key, value] = d.split(' ')
            const index = metadataKey.indexOf(key)
            if (!~index) return true
            if (!!~index) metadataKey.splice(index, 1)
            return METADATA[key].validator(Buffer.from(value, 'base64').toString())
          })
        }
      ]
    })

    if (check) {
      return
    }
    if (!!metadataKey.length) {
      return ctx.status = 404
    }

    const [, token] = verifyTokenToData(ctx)
    const { id: _id } = token

    const [metadata] = Params.sanitizers(headers, {
      name: 'upload-metadata',
      sanitizers: [
        data => {
          return (data.endsWith(',') ? data.slice(0, -1) : data).split(',').reduce((acc, cur) => {
            const [key, value] = cur.split(' ')
            acc[key] = Buffer.from(value, 'base64').toString()
            return acc
          }, {})
        }
      ]
    })

    const redisClient = getClient()
    const { md5 } = metadata

    const data = await new Promise((resolve) => {
      redisClient.del(md5, () => {
        resolve()
      })
    })
      .then(() => {
        return UserModel.findOne({
          _id: ObjectId(_id)
        })
          .select({
            roles: 1
          })
          .exec()
      })
      .then(notFound)
      .then(data => headRequestDeal({
        metadata,
        ctx,
        user: {
          _id: ObjectId(_id),
          roles: data.roles
        }
      }))
      .catch(err => {
        console.log(err)
        return false
      })

    if (!data) return ctx.status = 500

    const { offset, id, type } = data

    //设置索引来帮助恢复上传
    ctx.set('Upload-Offset', offset)
    ctx.set('Tus-Resumable', headers['tus-resumable'] || '1.0.0')
    ctx.set('Location', `/api/customer/upload`)
    ctx.set('Upload-Length', metadata.size)
    ctx.set('Upload-Id', id)

    ctx.status = 200

  })
  //文件上传-小程序
  .post('/weapp', postFile.bind(this, postRequestDeal))
  //分片上传
  .patch('/', postFile.bind(this, patchRequestDeal))
  //restore|load ?load=...
  .get('/', async (ctx) => {

    const { request: { url } } = ctx
    let data
    let query
    try {
      query = new URL(url).query
    } catch (err) {
      query = Url.parse(url).query
    }

    if (!query) {
      data = Promise.reject({
        errMsg: 'bad request',
        status: 400
      })
    } else {
      data = Promise.resolve(query.split('&').slice(0, 1).reduce((acc, cur) => {
        const [key, value] = cur.split('=').map(str => str.trim())
        acc[key] = value
        return acc
      }, {}))
    }

    data = await data
      .then(query => {
        const [[type, id]] = Object.entries(query)
        let params
        if (ObjectId.isValid(id)) {
          params = {
            _id: ObjectId(id)
          }
        } else if (typeof id === 'string' && /\/static\/(image|video|other)\/.+/.test(decodeURIComponent(id))) {
          params = {
            src: parseUrl(decodeURIComponent(id))
          }
        } else {
          return Promise.reject({ status: 400, errMsg: 'bad request' })
        }

        //文件查找
        return Promise.allSettled(models.map(model => {
          return model.findOne(params)
            .select({
              "info.status": 1,
              "info.complete": 1,
              "info.size": 1,
              "info.chun_size": 1,
              auth: 1,
              white_list: 1,
            })
            .exec()
            .then(notFound)
        }))
          .then(results => ({ results, type }))

      })
      .then(({
        results,
        type //load restore
      }) => {

        const index = results.findIndex(result => result.status === 'fulfilled')
        if (!~index) return Promise.reject({ errMsg: 'not found', status: 404 })
        const { value: { info: { status } = {}, _id } } = results[index]
        if (status === MEDIA_STATUS.COMPLETE) {
          return {
            data: _id.toString()
          }
        } else {
          return Promise.reject({ errMsg: '404', status: 404 })
        }
      })
      .catch(dealErr(ctx))

    // ctx.status = 200

    responseDataDeal({
      ctx,
      data,
      needCache: false
    })

  })
  //删除--无用
  .delete('/', async (ctx) => {
    ctx.status = 200
  })
  //新增
  .post('/', async (ctx) => {

    const { request: { headers } } = ctx

    const metadataKey = Object.keys(METADATA)

    const check = Params.headers(ctx, {
      name: 'tus-resumable',
      validator: [
        data => {
          return data === '1.0.0'
        }
      ]
    }, {
      name: 'upload-metadata',
      validator: [
        data => {
          if (!data) return false
          return (data.endsWith(',') ? data.slice(0, -1) : data).split(',').every(d => {
            const [key, value] = d.split(' ')
            const index = metadataKey.indexOf(key)
            if (!~index) return true
            if (!!~index) metadataKey.splice(index, 1)
            return !!~index && METADATA[key].validator(Buffer.from(value, 'base64').toString())
          })
        }
      ]
    })

    if (check || !!metadataKey.length) {
      ctx.status = 404
      return
    }

    const [, token] = verifyTokenToData(ctx)
    const { id: _id } = token

    const [metadata] = Params.sanitizers(headers, {
      name: 'upload-metadata',
      sanitizers: [
        data => {
          return (data.endsWith(',') ? data.slice(0, -1) : data).split(',').reduce((acc, cur) => {
            const [key, value] = cur.split(' ')
            acc[key] = Buffer.from(value, 'base64').toString()
            return acc
          }, {})
        }
      ]
    })

    const data = await UserModel.findOne({
      _id: ObjectId(_id)
    })
      .select({
        roles: 1
      })
      .exec()
      .then(notFound)
      .then(data => postMediaDeal({
        metadata,
        ctx,
        user: {
          _id: ObjectId(_id),
          roles: data.roles
        }
      }))
      .catch(err => {
        console.log(err)
        return false
      })

    if (!data) return ctx.status = 500

    const { id, type } = data
    //设置索引来帮助恢复上传
    ctx.set('Tus-Resumable', headers['tus-resumable'] || '1.0.0')
    ctx.set('Location', `/api/customer/upload`)
    ctx.set('Upload-Length', metadata.size)
    ctx.set('Upload-Id', id)

    ctx.status = 201

  })
  //视频新增海报
  .put('/video/poster', async (ctx) => {
    const check = Params.body(ctx, {
      name: 'data',
      validator: [
        data => {
          if (typeof data !== 'string' || !data) return false
          return data.split(',').every(item => {
            const [_id, poster] = item.split('-')
            return ObjectId.isValid(_id) && ObjectId.isValid(poster)
          })
        }
      ]
    })
    if (check) return

    const [, token] = verifyTokenToData(ctx)
    const { id: userId } = token

    const [updateData] = Params.sanitizers(ctx.request.body, {
      name: 'data',
      sanitizers: [
        data => data.split(',').map(item => {
          const [_id, poster] = item.split('-')
          return {
            _id: ObjectId(_id),
            poster: ObjectId(poster)
          }
        })
      ]
    })

    const data = await Promise.all(updateData.map(item => {
      const { _id, poster } = item
      return VideoModel.updateOne({
        _id,
        $or: [
          {
            $and: [
              {
                white_list: {
                  $in: [
                    ObjectId(userId)
                  ]
                }
              },
              {
                auth: MEDIA_AUTH.PRIVATE
              }
            ]
          },
          {
            auth: MEDIA_AUTH.PUBLIC
          }
        ]
      }, {
        $set: {
          poster
        }
      })
        .then(data => {
          if (data.nModified == 0) return Promise.reject({ errMsg: 'not found', status: 404 })
          return {
            _id
          }
        })
    }))
      .then(_ => {
        return {
          data: {}
        }
      })
      .catch(dealErr(ctx))

    responseDataDeal({
      data,
      needCache: false,
      ctx
    })

  })
// //视频新增海报
// .put('/video/poster', async (ctx) => {
//   const check = Params.body(ctx, {
//     name: 'data',
//     validator: [
//       data => {
//         if(typeof data !== 'string' || !data) return false 
//         return data.split(',').every(item => {
//           const [ _id, poster ] = item.split('-')
//           return ObjectId.isValid(_id) && ObjectId.isValid(poster)
//         })
//       }
//     ]
//   })
//   if(check) return 

//   const [ , token ] = verifyTokenToData(ctx)
//   const { id: userId } = token 

//   const [ updateData ] = Params.sanitizers(ctx.request.body, {
//     name: 'data',
//     sanitizers: [
//       data => data.split(',').map(item => {
//         const [ _id, poster ] = item.split('-')
//         return {
//           _id: ObjectId(_id),
//           poster: ObjectId(poster)
//         }
//       })
//     ]
//   })

//   const data = await UserModel.findOne({
//     _id: ObjectId(userId)
//   })
//   .select({
//     roles: 1
//   })
//   .exec()
//   .then(notFound)
//   .then(data => {
//     const curUserMaxRole = Math.min(...data.roles.map(item => ROLES_MAP[item]))
//     const MaxRole = Math.min(...Object.values(ROLES_MAP))

//     let query = {}
//     if(MaxRole < curUserMaxRole) {
//       query = merge({}, query, {
//         $or: [
//           {
//             white_list: {
//               $in: [ObjectId(userId)]
//             }
//           },
//           {
//             auth: MEDIA_AUTH.PUBLIC
//           }
//         ],
//         origin_type: {
//           $ne: MEDIA_ORIGIN_TYPE.ORIGIN
//         }
//       })
//     }

//     return Promise.all(updateData.map(item => {
//       const { _id, poster } = item 
//       query._id = _id 
//       return VideoModel.updateOne(query, {
//         $set: {
//           poster
//         }
//       })
//       .then(data => {
//         if(data.nModified == 0) return Promise.reject({ errMsg: 'not found', status: 404 })
//         return {
//           _id
//         }
//       })
//     }))
//   })
//   .then(_ => {
//     return {
//       data: {}
//     }
//   })
//   .catch(dealErr(ctx))

//   responseDataDeal({
//     data,
//     needCache: false,
//     ctx
//   })

// })

module.exports = router