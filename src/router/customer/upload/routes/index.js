const Router = require('@koa/router')
const { 
  VideoModel, 
  ImageModel, 
  OtherMediaModel, 
  UserModel, 
  notFound, 
  dealErr, 
  verifyTokenToData,
  Params,
  responseDataDeal,
  isType
} = require('@src/utils')
const { mergeChunkFile, finalFilePath, conserveBlob, isFileExistsAndComplete, ACCEPT_IMAGE_MIME, ACCEPT_VIDEO_MIME } = require('../util')
const path = require('path')

const router = new Router()

router
//检查文件名称是否正确
.use(async(ctx, next) => {
  const { method } = ctx
  let _method
  if(method.toLowerCase() === 'get' || method.toLowerCase() === 'delete') _method = 'query'
  if(method.toLowerCase() === 'post' || method.toLowerCase() === 'put') _method = 'body'

  const check = Params[_method](ctx, {
    name: 'name',
    type: ['isMd5']
  })
  if(check) return

  return await next()
})
//预查
.get('/', async(ctx) => {
  const check = Params.query(ctx, {
    //mime
    name: 'suffix',
    validator: [
      data => typeof data === 'string' && /^.+\/.+$/g.test(data)
    ]
  }, {
    //分片数量
    name: 'chunksLength',
    type: [ 'isInt' ],
    validator: [
      data => data > 0
    ]
  }, {
    //文件大小
    name: 'size',
    type: [ 'isInt' ],
    validator: [
      data => data > 0
    ]
  })
  if(check) return

  const { name: md5, chunksLength, size } = ctx.query
  const [ suffix, chunkSize, filename, auth ] = Params.sanitizers(ctx.query, {
    name: 'suffix',
    type: [ 'trim'],
    sanitizers: [
      data => data.toLowerCase()
    ]
  }, {
    name: 'chunkSize',
    type: [ 'toInt' ]
  }, {
    name: filename,
    _default: md5,
    sanitizers: [
      data => data.toString()
    ]
  }, {
    name: 'auth',
    _default: '0',
    sanitizers: [
      data => data == '1' ? 'PRIVATE' : 'PUBLIC'
    ]
  })

  const [, token] = verifyTokenToData(ctx)
  const { mobile } = token
  let model
  let Model
  
  //判断文件类型
  if(ACCEPT_IMAGE_MIME.some(item => !!~suffix.indexOf(item))) {
    model = 'image'
    Model = ImageModel
  }else if(ACCEPT_VIDEO_MIME.some(item => !!~suffix.indexOf(item))) {
    model = 'video'
    Model = VideoModel
  }else {
    model = 'other'
    Model = OtherMediaModel
  }

  //查找文件是否存在于数据库
  const data = await Model
  .findOne({
    "info.md5": md5
  })
  .select({
    info: 1,
  })
  .exec()
  .then(data => !!data && data._doc)
  .then(async (data) => {

    let isExits = isFileExistsAndComplete(`${md5}.${suffix.toLowerCase()}`, model, size, auth)

    //数据库中文件不存在
    if(!data) {
      //获取来源用户id
      const _id = await UserModel.findOne({
        mobile: Number(mobile)
      })
      .select({
        _id: 1
      })
      .exec()
      .then(data => !!data && data._id)

      //数据库创建新集合
      const newModel = new Model({
        name: filename || md5,
        src: path.resolve(finalFilePath(auth, model)),
        origin_type: "USER",
        origin: _id,
        auth,
        info: {
          md5,
          size,
          complete: isExits ? new Array(chunksLength).fill(0).map((_, i) => i) : [],
          chunk_size: chunksLength,
          mime: suffix,
          status: isExits ? 'COMPLETE' : 'UPLOADING'
        }
      })
      return await newModel.save() && (isExits ? false : [])
    }

    //数据库存在文件数据
    const { info:{ complete, status }, _id } = data

    //文件存在且已全部完成
    if(status === 'COMPLETE') {
      //文件存在且数据库与本地全部完整
      if(isExits) return false

      //存在误差则提示重新上传
      return Model.updateOne({
        name: md5
      }, {
        $set: {
          "info.complete": [],
          "info.status": "UPLOADING"
        }
      })
      .then(data => !!data && data.nModified === 1)
      .then(notFound)
      .then(_ => [])
    }
    //上传中
    else if(status === 'UPLOADING'){
      return [
        ...complete
      ]
    }
    //上传出错提示重新上传
    else {
      return []
    }

  })
  .catch(dealErr(ctx))

  if(data && !data.err) ctx.status = 206

  responseDataDeal({
    ctx,
    data: data,
    needCache: false
  })

})
//上传
.post('/', async(ctx) => {

  //参数预查
  const check = Params.body(ctx, {
    name: 'index',
    type: ['isInt'],
    validator: [
      data => data >= 0
    ]
  })
  if(check) return

  const { body: { index, name: md5, files:base64Files=[] }, files={} } = ctx.request
  const [, token] = verifyTokenToData(ctx)
  const { mobile } = token

  let file

  if(!!files && !!files.file && isType(files.file, 'file')) {
    file = files.file
  }else if(base64Files && !!base64Files.length) {
    const [target] = base64Files
    file = target.file
  }

  //上传用户用户查询
  const data = UserModel.findOne({
    mobile: Number(mobile)
  })
  .select({
    _id: 1
  })
  .exec()
  .then(data => !!data && data.doc._id)
  .then(notFound)
  .then(id => {
    const commonQuery = {
      name: md5,
      origin: id
    }
    //保存文件
    return conserveBlob(file, md5, index)
    //更新数据库
    .then(_ => Promise.all([
      ImageModel.updateOne(commonQuery, {
        $addToSet: { "info.complete": index }
      }),
      VideoModel.updateOne(commonQuery, {
        $addToSet: { "info.complete": index }
      }),
      OtherMediaModel.updateOne(commonQuery, {
        $addToSet: { "info.complete": index }
      }),
    ]))
  })
  .then(data => {
    if(!data.filter(d => d.n == 1).length) return Promise.reject({ errMsg: 'database wirte forbidden', status: 403 })
    return {
      name: md5,
      index
    }
  })
  .catch(dealErr(ctx))


  if(data && !data.err) ctx.status = 206

  responseDataDeal({
    ctx,
    data,
    needCache: false
  })

})
//完成
.put('/', async(ctx) => {

  const { body: { name: md5 } } = ctx.request
  const [, token] = verifyTokenToData(ctx)
  const { mobile } = token

  UserModel.findOne({
    mobile: Number(mobile)
  })
  .select({
    _id: 1
  })
  .exec()
  .then(data => !!data && data._doc._id)
  .then(notFound)
  .then(id => {
    //查询文件是否存在且完整
    const commonQuery = {
      name: md5,
      origin: id
    }
    const commonSelect = {
      info: 1,
      auth: 1,
    }

    //查询文件是否存在且完整
    return Promise.all([
      VideoModel.findOne(commonQuery)
      .select(commonSelect)
      .exec(),
      ImageModel.findOne(commonQuery)
      .select(commonSelect)
      .exec(),
      OtherMediaModel.findOne(commonQuery)
      .select(commonSelect)
      .exec()
    ])
  })
  .then(data => !!data && data)
  .then(notFound)
  .then(data => {
    const index = data.findIndex(val => !!val)
    //合并失败
    if(!~index) return Promise.reject({ errMsg: 'fail', status: 500 })
    //合并文件
    const { info: { chunk_size, complete, mime }, auth, _id } = data[index]
    if(chunk_size === complete.length) {
      let type
      let Model
      switch(index) {
        case 0: 
          type = 'video'
          Model = VideoModel
          break
        case 1: 
          type = 'image'
          Model = ImageModel
          break
        case 2: 
          type = 'other'
          Model = OtherMediaModel
          break
      }

      const [err, ] = mergeChunkFile({ name: md5, extname: type, mime, auth })
      if(err) return Promise.reject({ errMsg: 'unkonown error', status: 500 })
      
      //修改数据库状态
      return Model.updateOne({
        name: md5
      }, {
        $set: { "info.status": "COMPLETE" }
      })
      .then(data => !!data && data.nModified === 1)
      .then(notFound)
      .then(_ => {
        Model = null
        return _id
      })

    }else {
      return [...complete]
    }
  })
  .catch(dealErr(ctx))

  if(data && !data.err) ctx.status = 206
  responseDataDeal({
    ctx,
    data,
    needCache: false
  }) 

})

module.exports = router