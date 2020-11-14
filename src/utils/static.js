const { UserModel, ImageModel, VideoModel, OtherMediaModel } = require('./mongodb/mongo.lib')
const { verifyTokenToData, fileEncoded } = require('./token')
const { dealErr, responseDataDeal, notFound } = require('./error-deal')
const { STATIC_FILE_PATH, MAX_FILE_SINGLE_RESPONSE_SIZE } = require('./constant')
const fs = require('fs')
const path = require('path')
const Mime = require('mime')
const Day = require('dayjs')

const StaticMiddleware = async(ctx, next) => {

  const { request: { url } } = ctx

  //非静态资源或公用资源放行
  if(!/\/(public|private)\/(video|image|other)\/[0-9a-zA-Z]+\.[0-9a-zA-Z]+/.test(url)) return await next()

  let model
  let fileData
  let response
  let isLimitMinSizeFile = false
  let userId
  let etag
  const [, token] = verifyTokenToData(ctx)
  const isPrivate = /\/private\/(video|image|other)\/[0-9a-zA-Z]+\.[0-9a-zA-Z]+/.test(url)

  let [ filePath ] = url.match(/\/(private|public).+/)

  //资源类型判断
  if(/\/image\/.+/.test(filePath)) {
    model = ImageModel
  }else if(/\/video\/.+/.test(filePath)) {
    model = VideoModel
  }else {
    model = OtherMediaModel
  }

  if(!token && isPrivate) {
    response = dealErr(ctx)({ errMsg: 'not auth', status: 403 })
  }else {
    const data = await new Promise((resolve, reject) => {
      if(token) {
        const { mobile } = token
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
        src: filePath,
        // auth: 'PRIVATE',
        // white_list: { $in: [ _id ] },
        "info.status": "COMPLETE"
      })
      .select({
        _id: 0,
        name: 1,
        src: 1,
        "info.mime": 1,
        "info.size": 1,
        updatedAt: 1,
        white_list: 1,
        auth: 1
      })
      .exec()
    })
    .then(data => !!data && data._doc)
    .then(async (data) => {
      if(!data && isPrivate) {
        return Promise.reject({ errMsg: 'not found', status: 404 })
      }
      try {
        const _path = path.join(STATIC_FILE_PATH, filePath)
        let fileStat
        try {
          fileStat = fs.statSync(_path)
          if(!fileStat.isFile()) return Promise.reject({ errMsg: 'file not found', status: 404 })
        }catch(err) {
          return Promise.reject({ errMsg: 'file not found', status: 404 })
        }

        //小文件交给下面的中间件处理
        if(!!fileStat && fileStat.size <= MAX_FILE_SINGLE_RESPONSE_SIZE) {
          isLimitMinSizeFile = true
        }

        //etg获取
        fileData = fs.readFileSync(_path)
        etag = fileEncoded(fileData)

        if(!!data) return data

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
          src: filePath,
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
        return Promise.reject({ errMsg: 'file not found', status: 404 })
      }
    })
    .then(data => {
      const { white_list, auth, ...nextData } = data
      if(auth.toLowerCase() === 'private' && !white_list.some(user => user.equals(userId))) return Promise.reject({ errMsg: 'auth forbidden', status: 403 })
      return nextData
    })
    .catch(dealErr(ctx))

    if(isLimitMinSizeFile) return await next()

    responseDataDeal({
      ctx,
      data,
      afterDeal: (res) => {
        const { name, info: { mime, size }={}, updatedAt } = data
        const { status } = ctx
        //请求头设置
        ctx.set({
          'Content-Type': mime.toLowerCase(),
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
              const [ target ] = range.match(/(?<=bytes=).+/);
              [start, end] = target.split('/')[0].split('-')
            }catch(err){

            }
          }

          if(end == undefined) end = size - 1

          if(Number.isNaN(parseInt(end)) || parseInt(end) > size || parseInt(end) <= 0 || Number.isNaN(parseInt(start)) || parseInt(start) < 0 || parseInt(start) > size || parseInt(start) >= parseInt(end)) {
            ctx.status = 416
            const error = dealErr(ctx)({ errMsg: 'range error', status: 416 })
            // responseDataDeal({
            //   ctx,
            //   data: error
            // })
            return {
              success: false,
              res: {
                ...error.res
              }
            }
          }

          ctx.set({
            'Content-Range': `bytes ${start}-${end}/${size}`,
            'Content-Length': end - start
          })

          ctx.status = 206
          
          return fileData.slice(start, end)
        }
        
        return response
      },
      etagValidate: (ctx) => {

        const { request: { headers } } = ctx

        const prevEtag = headers['if-none-match'] || headers['If-None-Match']
        const modified = headers['if-modified-since'] || headers['If-Modified-Since']
        const stat = fs.statSync(path.join(STATIC_FILE_PATH, filePath))

        let isSameEtag = false

        if(new Date(stat.mtimeMs).toString() === new Date(modified).toString() && etag.length >= 1 && etag == prevEtag) {
          isSameEtag = true
        }

        ctx.set({
          etag,
          'last-modified': new Date(stat.mtimeMs)
        })
      
        return isSameEtag
      }
    })

  }

}

module.exports = {
  StaticMiddleware
}