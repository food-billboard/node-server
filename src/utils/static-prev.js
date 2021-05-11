const fs = require('fs').promises
const fsSync = require('fs')
const Url = require('url')
const path = require('path')
const Mime = require('mime')
const Day = require('dayjs')
const { ImageModel, VideoModel, OtherMediaModel } = require('./mongodb/mongo.lib')
const { verifyTokenToData, fileEncoded } = require('./token')
const { dealErr, notFound } = require('./error-deal')
const { STATIC_FILE_PATH, MAX_FILE_SINGLE_RESPONSE_SIZE, MEDIA_AUTH, MEDIA_STATUS } = require('./constant')

const getEndPath = (path, index) => {
  let list = path.split('/')
  let i
  if(typeof index === 'number') {
    if(index >= 0) {
      i = index
    }else {
      i = -index - 1
      list = list.reverse()
    }
  }else {
    i = list.length - 1
  }
  return list[i]
}

const mediaDeal = {
  image: ({
    md5,
  }) => {
    return ImageModel.findOne({
      "info.md5": md5
    })
    .select({
      auth: 1,
      "info.status": 1,
      "info.mime": 1,
      white_list: 1
    })
    .exec()
    .then(data => !!data && data._doc)
    .then(notFound)
    .then(data => ({ ...data, path: `/image/${md5}.${Mime.getExtension(data.info.mime)}` }))
  },
  video: ({
    md5,
  }) => {
    return VideoModel.findOne({
      "info.md5": md5
    })
    .select({
      auth: 1,
      "info.status": 1,
      "info.mime": 1,
      white_list: 1
    })
    .exec()
    .then(data => !!data && data._doc)
    .then(notFound)
    .then(data => ({ ...data, path: `/video/${md5}.${Mime.getExtension(data.info.mime)}` }))
  },
  other: ({
    md5,
  }) => {
    return OtherMediaModel.findOne({
      "info.md5": md5
    })
    .select({
      auth: 1,
      "info.status": 1,
      "info.mime": 1,
      white_list: 1
    })
    .exec()
    .then(data => !!data && data._doc)
    .then(notFound)
    .then(data => ({ ...data, path: `/other/${md5}.${Mime.getExtension(data.info.mime)}` }))
  }
}

const isValid = (fileInfo) => {
  // {
  //   auth,
  //   info: {
  //     status,
  //     mime
  //   },
  //   white_list,
  //   token
  // }

  const { info: { mime, status }, auth, token, white_list } = fileInfo

  if(auth.toUpperCase() === MEDIA_AUTH.PUBLIC) return Promise.resolve({
    ...fileInfo,
    mime: mime.toLowerCase()
  })
  if(!token || status.toUpperCase() !== MEDIA_STATUS.COMPLETE || !white_list.some(user => user.equals(token._id))) return Promise.reject({ errMsg: 'forbidden', status: 403 })
  return Promise.resolve({
    ...fileInfo,
    mime: mime.toLowerCase(),
  })
}

const readFileRange = (ctx, size) => {
  const { request: { headers } } = ctx
  let range = headers['range'] //bytes=range-start-range-end, ...
  let start = 0
  let end = MAX_FILE_SINGLE_RESPONSE_SIZE
  const valid = !!range
  if(valid) {
    range = range.trim()
    try {
      const [ target ] = range.match(/(?<=bytes=).+/);
      [start, end] = target.split('/')[0].split('-')
    }catch(err){
      console.log(err)
    }
  }else {
    //todo
  }

  end = parseInt(end)
  start = parseInt(start)

  if(Number.isNaN(end) || end > size || end <= 0 || Number.isNaN(start) || start < 0 || start > size || start >= end) {
    return false
  }

  return {
    start,
    end,
    valid
  }
}

const readFile = async ({
  path,
  ctx
}) => {

  let size

  try {
    const stat = fsSync.statSync(path)
    size = stat.size
  }catch(err) {
    console.log(err)
    return Promise.reject({ errMsg: 'range error', status: 404 })
  }

  const range = readFileRange(ctx, size)
  if(!range) return Promise.reject({ errMsg: 'range error', status: 416 })

  const { start, end, valid } = range
  let fileBuffer = Buffer.alloc(end - start)
  let fileHandle

  try {
    fileHandle = await fs.open(path, 'r', fsSync.constants.S_IRUSR)
    fileHandle.read(fileBuffer, 0, fileBuffer.byteLength, start)
  }catch(err) {
    console.log(err)
  }finally {
    if(fileHandle) await fileHandle.close()
  }

  return {
    start,
    end,
    file: fileBuffer,
    size
  }

}

const StaticMiddleware = async (ctx, next) => {

  const { request: { url } } = ctx

  //非静态资源
  if(!/\/(video|image|other)\/[0-9a-zA-Z]+\.[0-9a-zA-Z]+/.test(url)) return await next()

  const { request: { headers } } = ctx
  const [, token] = verifyTokenToData(ctx)
  let pathname 
  try {
    pathname = new URL(url).pathname
  }catch(err) {
    pathname = Url.parse(url).pathname
  }
  let md5 = getEndPath(pathname)
  const type = getEndPath(pathname, -2).toLowerCase()
  md5 = md5.includes('.') ? md5.split('.')[0] : md5
  let mime

  let filePath

  if(type === 'other') return await next()

  const data = await new Promise((resolve, reject) => {
    if(!!mediaDeal[type]) {
      resolve(mediaDeal[type]({ md5 }))
    }else {
      reject()
    }
  })
  .then(data => isValid({
    ...data,
    token
  }))
  .then((data) => {
    mime = data.mime
    filePath = path.join(STATIC_FILE_PATH, data.path)
    return fs.stat(filePath)
  })
  .then(stat => {
    const { size, mtimeMs } = stat
    const lastModified = headers['last-modified']

    //小文件由其他中间件处理
    if(size <= MAX_FILE_SINGLE_RESPONSE_SIZE) return

    //是否未更改
    if(!!lastModified && Day(lastModified).valueOf() === mtimeMs) return true
    //读取部分文件
    return readFile({
      path: filePath,
      ctx
    })

  })
  .catch(dealErr(ctx))

  if(typeof data === 'undefined') return await next()

  if(data === true) return ctx.status = 304

  if(data.status) return ctx.status = data.status

  const { start, end, size, file } = data
  let status = 206
  let responseHeaders = {
    'Content-Type': mime,
    'Content-Range': `bytes ${start}-${end}/${size}`,
    'Accept-Ranges': 'bytes'
    // 'Content-Length': end - start
  }
  ctx.set(responseHeaders)
  if(end === size) status = 200

  ctx.status = status
  ctx.body = file

}

module.exports = {
  StaticMiddleware
}