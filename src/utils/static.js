const { UserModel, ImageModel, VideoModel, OtherMediaModel } = require('./mongodb/mongo.lib')
const { verifyTokenToData, fileEncoded } = require('./token')
const { dealErr, responseDataDeal, notFound } = require('./error-deal')
const { STATIC_FILE_PATH } = require('./tool')
const fs = require('fs')
const path = require('path')

const StaticMiddleware = async(ctx, next) => {

  const { request: { url } } = ctx

  //非静态资源或公用资源放行
  if(!/\/api\/[0-9a-zA-Z]+\/static\/(public|private)\/(video|image|other)\/[0-9a-zA-Z]+/.test(url) || /\/api\/[0-9a-zA-Z]\/public\/(video|image|other)\/[0-9a-zA-Z]+/.test(url)) return await next()

  let model
  let fileData
  let response
  const [, token] = verifyTokenToData(ctx)

  let [ filePath ] = url.match(/(?<=.+\/static)\/private.+/)

  //资源类型判断
  if(/^\/image\/.+/.test(filePath)) {
    model = ImageModel
  }else if(/^\/video\/.+/.test(filePath)) {
    model = VideoModel
  }else {
    model = OtherMediaModel
  }

  //未登录
  if(!token) {
    response = dealErr({ errMsg: 'not authority', status: 401 })
  }else {
    const { mobile } = token
    const data = await UserModel.findOne({
      mobile: Number(mobile)
    })
    .select({
      _id: 1
    })
    .exec()
    .then(data => !!data && data._doc._id)
    .then(notFound)
    .then(_id => {
      //资源信息查找
      return model.findOne({
        src: `/static${filePath}`,
        auth: 'PRIVATE',
        $or: [
          {
            origin: _id
          },
          {
            white_list: { $in: [ _id ] }
          }
        ],
        "info.status": "COMPLETE"
      })
    })
    .select({
      _id: 0,
      name: 1,
      "info.mime": 1,
      "info.size": 1,
      updatedAt: 1
    })
    .exec()
    .then(data => !!data && data._doc)
    .then(notFound)
    .then(data => {
      try {
        fileData = fs.readFileSync(path.resolve(STATIC_FILE_PATH, filePath))
      }catch(err) {
        console.log('文件读取错误', err)
        return Promise.reject({ errMsg: 'file not found', status: 404 })
      }
      return data
    })
    .catch(dealErr(ctx))

    responseDataDeal({
      ctx,
      data,
      afterDeal: (response) => {
        const { name, info: { mime, size }, updatedAt } = response
        //请求头设置
        ctx.set({
          'Content-Type': mime,
          'Content-Length': size
        })
        
        return fileData
      },
      etagValidate: (ctx, etag) => {

        let isSameEtag = true
        if(typeof etag !== 'string') isSameEtag = false

        const newEtag = fileEncoded(fileData)
        
        if(newEtag !== etag) isSameEtag = false
      
        if(newEtag.length > 1) ctx.set({ etag: newEtag })
      
        return isSameEtag
      }
    })

  }

}

module.exports = {
  StaticMiddleware
}