const { UserModel, ImageModel, VideoModel, OtherMediaModel } = require('./mongodb/mongo.lib')
const { verifyTokenToData, fileEncoded } = require('./token')
const { dealErr, responseDataDeal, notFound } = require('./error-deal')
const { STATIC_FILE_PATH, MAX_FILE_SINGLE_RESPONSE_SIZE } = require('./tool')
const fs = require('fs')
const path = require('path')
const Mime = require('mime')

const StaticMiddleware = async(ctx, next) => {

  const { request: { url } } = ctx

  //非静态资源或公用资源放行
  if(!/\/api\/[0-9a-zA-Z]+\/static\/(public|private)\/(video|image|other)\/[0-9a-zA-Z]+/.test(url)) return await next()

  let model
  let fileData
  let response
  let isLimitMinSizeFile = false
  let userId
  let etag
  const [, token] = verifyTokenToData(ctx)
  const isPrivate = /\/api\/[0-9a-zA-Z]+\/static\/private\/(video|image|other)\/[0-9a-zA-Z]+/.test(url)

  let [ filePath ] = url.match(/(?<=.+\/static)\/(private|public).+/)

  //资源类型判断
  if(/^\/image\/.+/.test(filePath)) {
    model = ImageModel
  }else if(/^\/video\/.+/.test(filePath)) {
    model = VideoModel
  }else {
    model = OtherMediaModel
  }

  if(!token && isPrivate) {
    response = dealErr(ctx)({ errMsg: 'not auth', status: 403 })
  }else {
    if(token) {
      const { mobile } = token
      userId = await UserModel.findOne({
        mobile: Number(mobile)
      })
      .select({
        _id: 1
      })
      .exec()
      .then(data => !!data && data._doc._id)
      .catch(err => {
        console.log('user not found', err)
        response = dealErr({ errMsg: 'user not found', status: 404 })
      })
    }
    await new Promise((resolve, reject) => {
      if(token) {
        UserModel.findOne({
          mobile: Number(mobile)
        })
        .select({
          _id: 1
        })
        .exec()
        .then(data => !!data && data._doc._id)
        .then(data => {
          userId = data
          resolve()
        })
      }else {
        resolve()
      }
    })
    .then(_ => {
      return model.findOne({
        src: `/static${filePath}`,
        // auth: 'PRIVATE',
        // white_list: { $in: [ _id ] },
        "info.status": "COMPLETE"
      })
    })
    .select({
      _id: 0,
      name: 1,
      "info.mime": 1,
      "info.size": 1,
      updatedAt: 1,
      white_list: 1,
      auth: 1
    })
    .exec()
    .then(data => !!data && data._doc)
    .then(async (data) => {
      if(!data && isPrivate) {
        return Promise.reject({ errMsg: 'not found', status: 404 })
      }
      try {
        const _path = path.resolve(STATIC_FILE_PATH, filePath)
        let fileStat
        try {
          fileStat = fs.statSync(_path)
          if(!fileData.isFile()) return Promise.reject({ errMsg: 'file not found', status: 404 })
        }catch(err) {
          console.log('oops: ', err)
          return Promise.reject({ errMsg: 'file not found', status: 404 })
        }

        //小文件交给下面的中间件处理
        if(fileStat.size <= MAX_FILE_SINGLE_RESPONSE_SIZE) {
          isLimitMinSizeFile = true
        }

        //etg获取
        fileData = fs.readFileSync(_path)
        etag = fileEncoded(fileData)

        if(data) return data

        //数据库不存在则创建
        const res = {
          name: etag,
          info: {
            mime: Mime.getType(url),
            size: fileStat.size,
          },
          white_list: userId ? [userId] : [],
          auth: 'PUBLIC'
        }
        const newModel = new model({
          name: res.name,
          auth: res.auth,
          white_list: res.white_list,
          origin_type: 'USER',
          src: `/static${filePath}`,
          info: {
            ...res.info,
            md5: etag,
            complete: [0],
            chunk_size: 1,
            status: 'COMPLETE'
          }
        })

        await newModel.save()

        return res

      }catch(err) {
        console.log('文件读取错误', err)
        return Promise.reject({ errMsg: 'file not found', status: 404 })
      }
    })
    .then(data => {
      const { white_list, auth, ...nextData } = data
      if(auth.toLowerCase() === 'private' && !white_list.some(user => user.equals(userId))) return Promise.reject({ errMsg: 'auth forbidden', status: 403 })
      return nextData
    })
    // .then(data => {
    //   try {
    //     const _path = path.resolve(STATIC_FILE_PATH, filePath)
    //     const fileSize = fs.statSync(_path).size
    //     //小文件交给下面的中间件处理
    //     if(fileSize <= MAX_FILE_SINGLE_RESPONSE_SIZE) {
    //       isLimitMinSizeFile = true
    //       return
    //     }
    //     //etg获取
    //     fileData = fs.readFileSync(_path)
    //     etag = fileEncoded(fileData)
    //   }catch(err) {
    //     console.log('文件读取错误', err)
    //     return Promise.reject({ errMsg: 'file not found', status: 404 })
    //   }

    //   return data
    // })
    .catch(dealErr(ctx))

    if(isLimitMinSizeFile) return await next()

    responseDataDeal({
      ctx,
      data,
      afterDeal: (response) => {
        const { name, info: { mime, size }, updatedAt } = response
        const { status } = ctx
        //请求头设置
        ctx.set({
          'Content-Type': mime,
          'Content-Length': size,
        })

        if(status != '304') {
          const { request: { headers } } = ctx
          let range = headers['range'] || headers['Range'] //bytes=range-start-range-end, ...
          let start = 0
          let end = 1024 * 500
          if(!!range) {
            range = range.trim()
            try {
              [[start, end]] = range.match(/(?<=bytes=).+/).split(',').map(item => item.split('-'))
            }catch(err){}
          }

          if(end == undefined) end = size - 1
          if(Number.isNaN(parseInt(end)) || parseInt(end) >= size || Number.isNaN(parseInt(start)) || parseInt(start) < 0) {
            ctx.status = 416
            const error = dealErr(ctx)({ errMsg: 'range error', status = 416 })
            responseDataDeal({
              ctx,
              data: error
            })
            return 
          }

          ctx.set({
            'Content-Range': `bytes ${start}-${end}/${size}`,
            'Content-Length': end - start
          })
        }
        
        return fileData
      },
      etagValidate: (ctx, prevEtag) => {

        let isSameEtag = true
        if(typeof prevEtag !== 'string') isSameEtag = false
        
        if(prevEtag !== etag) isSameEtag = false
      
        if(etag.length > 1) ctx.set({ etag })
      
        return isSameEtag
      }
    })

  }

}

module.exports = {
  StaticMiddleware
}