const Router = require('@koa/router')
const { dealMedia, VideoModel, ImageModel, OtherMediaModel, notFound, dealErr } = require('@src/utils')
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

router
//预查
.get('/', async(ctx) => {
  const { md5 } = ctx.query
  let res
  //查找文件是否存在于数据库
  const data = await Promise.all([
    VideoModel.findOne({
      name: md5
    })
    .select({
      _id: 0,
      info: 1
    })
    .exec(),
    ImageMode.findOne({
      name: md5
    })
    .select({
      _id: 0,
      info: 1
    })
    .exec(),
    OtherMediaModel.findOne({
      name: md5
    })
    .select({
      _id: 0,
      info: 1
    })
    .exec()
  ])
  .then(data => !!data && data)
  .then(notFound)
  .then(data => {
    const index = data.findIndex(val => !!val)
    //文件不存在
    if(!~index) return []

    const { info:{ complete, status } } = data[index]
    //文件存在且已全部完成
    if(status === 'COMPLETE') {
      return false
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
  //查看是否传入了文件的类型，不然无法知晓到底存储至哪一个服务器集合
})
//完成
.put('/', async(ctx) => {
  const { body: { md5 } } = ctx.request
  let res

  const data = await Promise.all([
    VideoModel.findOne({
      name: md5
    })
    .select({
      info: 1,
      _id: 0
    })
    .exec(),
    ImageModel.findone({
      name: md5
    })
    .select({
      info: 1,
      _id: 0
    })
    .exec(),
    OtherMediaModel.findOne({
      name: md5
    })
    .select({
      info: 1,
      _id: 0
    })
    .exec()
  ])
  .then(data => !!data && data)
  .then(notFound)
  .then(data => {
    const index = data.findIndex(val => !!val)
    if(!~index) return Promise.reject({ errMsg: 'fail', status: 500 })
    const { info: { chunkSize, complete } } = data[index]
    if(chunkSize === complete.length) {
      return null
    }else {
      return [...complete]
    }
  })
  .then(data => {
    if(data) return data

  })
  .catch(dealErr(ctx))
  if(data && data.err) {
    res = {
      ...data.res
    }
  }else {
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