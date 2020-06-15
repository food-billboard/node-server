const Router = require('@koa/router')
const { 
  VideoModel, 
  ImageModel, 
  OtherMediaModel, 
  UserModel, 
  notFound, 
  dealErr, 
  verifyTokenToData
} = require('@src/utils')
const {   mergeChunkFile, finalFilePath, conserveBlob, isFileExistsAndComplete  } = require('../util')
const path = require('path')

const router = new Router()

const ACCEPT_IMAGE_MIME = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp']
const ACCEPT_VIDEO_MIME = ['avi', 'mp4', 'rmvb', 'mkv', 'f4v', 'wmv']

router
//预查
.get('/', async(ctx) => {
  const { name: md5, suffix, chunkSize, chunksLength, size, filename, auth='PUBLIC' } = ctx.query
  if(!md5 || !suffix || !chunksLength || !size) {
    ctx.status = 400
    ctx.body = JSON.stringify({
      success: false,
      res: {
        errMsg: 'bad request'
      }
    })
    return 
  }
  const [, token] = verifyTokenToData(ctx)
  const { mobile } = token
  let res
  let model
  let Model
  
  if(ACCEPT_IMAGE_MIME.includes(suffix)) {
    model = 'image'
    Model = ImageModel
  }else if(ACCEPT_VIDEO_MIME.includes(suffix)) {
    model = 'video'
    Model = VideoModel
  }else {
    model = 'other'
    Model = OtherMediaModel
  }

  //查找文件是否存在于数据库
  const data = await Model
  .findOne({
    name: md5
  })
  .select({
    _id: 0,
    info: 1,
  })
  .exec()
  .then(data => !!data && data._doc)
  .then(async (data) => {

    let isExits = isFileExistsAndComplete(`${md5}.${suffix.toLowerCase()}`, model, size, auth)

    //数据中文件不存在
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
        name: md5,
        src: path.resolve(finalFilePath(auth, model)),
        origin_type: "USER",
        origin: _id,
        auth,
        info: {
          size,
          complete: isExits ? new Array(chunksLength).fill(0).map((_, i) => i) : [],
          chunk_size: chunksLength,
          mime: suffix,
          status: isExits ? 'COMPLETE' : 'UPLOADING'
        }
      })
      return await newModel.save() && (isExits ? false : [])
    }

    const { info:{ complete, status } } = data
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

  if(data && data.err) {
    res = {
      ...data.res
    }
  }else {
    if(data) {
      ctx.status = 206
      //设置分片上传请求头条
      // ctx.set()
    }
    res = {
      success: true,
      res: {
        data
      }
    }
  }

  ctx.body = JSON.stringify(res)
})
//上传
.post('/', async(ctx) => {
  const { files } = ctx.request
  const { body: { index, name: md5 } } = ctx.request
  const file = files.file
  if(!file || !index || !md5) {
    ctx.status = 400
    ctx.body = JSON.stringify({
      success: false,
      res: {
        errMsg: 'file not found'
      }
    })
    return 
  }
  let res
  const data = await conserveBlob(file.path, md5, index)
  .then(_ => Promise.all([
    ImageModel.updateOne({
      name: md5
    }, {
      $addToSet: { "info.complete": index }
    }),
    VideoModel.updateOne({
      name: md5
    }, {
      $addToSet: { "info.complete": index }
    }),
    OtherMediaModel.updateOne({
      name: md5
    }, {
      $addToSet: { "info.complete": index }
    }),
  ]))
  .then(data => {
    if(!data.filter(d => d.n == 1).length) return Promise.reject({ errMsg: 'database error', status: 500 })
    return {
      name: md5,
      index
    }
  })
  .catch(dealErr(ctx))

  if(data && data.err) {
    res = {
      ...data.res
    }
  }else {
    ctx.status = 206
    //设置分片上传请求头条
    // ctx.set()
    res = {
      success: true,
      res: {
        data
      }
    }
  }

  ctx.body = JSON.stringify(res)
})
//完成
.put('/', async(ctx) => {
  const { body: { name: md5 } } = ctx.request
  let res

  const data = await Promise.all([
    VideoModel.findOne({
      name: md5
    })
    .select({
      info: 1,
      auth: 1,
      _id: 0
    })
    .exec(),
    ImageModel.findOne({
      name: md5
    })
    .select({
      info: 1,
      auth: 1,
      _id: 0
    })
    .exec(),
    OtherMediaModel.findOne({
      name: md5
    })
    .select({
      info: 1,
      auth: 1,
      _id: 0
    })
    .exec()
  ])
  .then(data => !!data && data)
  .then(notFound)
  .then(data => {
    const index = data.findIndex(val => !!val)
    //合并失败
    if(!~index) return Promise.reject({ errMsg: 'fail', status: 500 })
    //合并文件
    const { info: { chunk_size, complete, mime }, auth } = data[index]
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
        return null
      })

    }else {
      return [...complete]
    }
  })
  .catch(dealErr(ctx))

  if(data && data.err) {
    res = {
      ...data.res
    }
  }else {
    if(data) {
      ctx.status = 206
      //设置分片上传请求头条
      // ctx.set()
    }
    res = {
      success: true,
      res: {
        data
      }
    }
  }

  ctx.body = JSON.stringify(res)
})

module.exports = router