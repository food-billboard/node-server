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
    .then(data => ({ ...data, path: `/image/${md5}.${Mime.getExtension(data.mime)}` }))
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
    .then(data => ({ ...data, path: `/video/${md5}.${Mime.getExtension(data.mime)}` }))
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
    .then(data => ({ ...data, path: `/other/${md5}.${Mime.getExtension(data.mime)}` }))
  }
}

const isValid = ({
  auth,
  info: {
    status,
    mime
  },
  white_list,
  token
}) => {
  if(auth.toUpperCase() === MEDIA_AUTH.PUBLIC) return Promise.resolve({
    mime: mime.toLowerCase()
  })
  if(!token || status.toUpperCase() !== MEDIA_STATUS.COMPLETE || !white_list.some(user => user.equals(token._id))) return Promise.reject({ errMsg: 'forbidden', status: 403 })
  return Promise.resolve({
    mime: mime.toLowerCase()
  })
}

const readFileRange = (ctx) => {
  const { request: { headers } } = ctx
  let range = headers['range'] //bytes=range-start-range-end, ...
  let start = 0
  let end = MAX_FILE_SINGLE_RESPONSE_SIZE
  const valid = !!ranage
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
  path: relativePath,
  ctx
}) => {

  const range = readFileRange(ctx)
  if(!range) return Promise.reject({ errMsg: 'range error', status: 416 })

  const absolutePath = path.join(STATIC_FILE_PATH, '../', relativePath)
  const { start, end, valid } = range
  let fileBuffer = Buffer.alloc(end - start)
  let fileHandle
  let size

  try {
    fileHandle = await fs.open(absolutePath, 'r', fsSync.constants.S_IRUSR)
    fileHandle.read(fileBuffer, 0, fileBuffer.byteLength, start)
    const stat = fsSync.statSync(absolutePath)
    size = stat.size
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

readFile({
  path: '/static/video/581147cb51c9ee6e0e2f23b791ff9f58.mp4',
  ctx: {}
})

const StaticMiddleware = async (ctx, next) => {

  const { request: { url } } = ctx

  //非静态资源
  if(!/\/(video|image|other)\/[0-9a-zA-Z]+\.[0-9a-zA-Z]+/.test(url)) return await next()

  const { request: { headers } } = ctx
  const [, token] = verifyTokenToData(ctx)
  const { pathname } = Url.parse(url)
  let md5 = getEndPath(pathname)
  const type = getEndPath(pathname, -2).toLowerCase()
  md5 = md5.includes('.') ? md5.split('.')[0] : md5
  let mime

  let filePath

  const data = await !!mediaDeal[type] ? mediaDeal[type]({ md5 }) : Promise.reject()
  .then(data => isValid({
    ...data,
    token
  }))
  .then((data) => {
    mime = data.mime
    filePath = path.join(STATIC_FILE_PATH, '../', data.path)
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