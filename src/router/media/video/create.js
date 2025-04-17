const Router = require('@koa/router')
const { Types: { ObjectId } } = require("mongoose")
const fs = require('fs-extra')
const path = require("path")
const { merge } = require('lodash')
const mime = require('mime')
const {
  VideoModel,
  dealErr,
  responseDataDeal,
  Params,
  verifyTokenToData,
  loginAuthorization,
  MEDIA_AUTH,
  MEDIA_STATUS,
  fileAsyncMd5,
  STATIC_FILE_PATH_NO_WRAPPER,
  MEDIA_ORIGIN_TYPE,
} = require('@src/utils')
const dayjs = require('dayjs')
const { func } = require('./poster')

const router = new Router()

const CHUNK_SIZE = 5 * 1024 * 1024 * 1024

router
  .use(loginAuthorization())
  // 创建视频数据库
  .post("/", async (ctx) => {

    const check = Params.body(ctx, {
      name: 'src',
      validator: [
        data => !!data 
      ]
    })

    if (check) return

    const {
      poster,
      file_name='',
      description='',
      expire,
      src,
    } = ctx.request.body

    const [, token] = verifyTokenToData(ctx)

    const { id } = token

    // 查找文件
    // 文件解析 md5、mime、分片数量
    // 数据库查找md5 
    // mime查找
    const absolutePath = path.join(STATIC_FILE_PATH_NO_WRAPPER, src)
    let database = {
      description,
      src,
      auth: MEDIA_AUTH.PUBLIC,
      origin_type: MEDIA_ORIGIN_TYPE.USER,
      info: {
        complete: [],
        status: MEDIA_STATUS.COMPLETE,
        mime: mime.getType(src)
      }
    }
    let setOriginData = {}
    if(dayjs(expire).isValid()) {
      database.expire = dayjs(expire).toDate()
      setOriginData.expire = database.expire
    }
    if(file_name) {
      setOriginData = {
        ...setOriginData,
        file_name: file_name,
        name: file_name 
      }
    }
    if(poster) {
      setOriginData.poster = ObjectId(poster)
    }

    const data = await fs.stat(absolutePath)
    .then(fileInfo => {
      if(!fileInfo.isFile()) return Promise.reject({ errMsg: 'not Found', status: 404 })
      database = merge(database, {
        info: {
          size: fileInfo.size,
          chunk_size: Math.ceil(fileInfo.size / CHUNK_SIZE)
        }
      })
      return fileAsyncMd5(absolutePath)
    })
    .then(md5 => {
      const [suffix] = src.split('.').slice(-1)
      database.src = `/static/video/${md5}.${suffix}`
      database = merge(database, {
        file_name: file_name || md5,
        name: file_name || md5,
        info: {
          md5 
        }
      })
      return VideoModel.findOne({
        "info.md5": md5 
      })
      .select({
        src: 1,
      })
      .exec()
      .then(data => {
        // 存在就直接把源文件删了就行
        // 如果原文件的大小和实际不一样，直接删掉
        if(data) {
          const { src: originSrc } = data 
          const originAbsolutePath = path.join(STATIC_FILE_PATH_NO_WRAPPER, originSrc)
          return fs.unlink(originAbsolutePath)
          .catch(() => {})
          .then(() => {
            if(Object.keys(setOriginData).length) {
              return VideoModel.updateOne({
                "info.md5": md5
              }, {
                $set: setOriginData
              })
            }
          })
        }else {
          if(!poster) {
            return func({
              posterName: md5,
              // 视频地址
              src,
              userId: id,
            })
            .then(data => {
              database.poster = data._id 
            })
            .then(() => {
              const newModel = new VideoModel(database)
              return newModel.save()
            })
          }
          const newModel = new VideoModel(database)
          return newModel.save()
        }
      })
    })
    .then(() => {
      // 更换成md5
      return fs.move(absolutePath, path.join(STATIC_FILE_PATH_NO_WRAPPER, database.src)).catch(() =>{})
    })
      .then(() => {
        return {
          data: null 
        }
      })
      .catch(dealErr(ctx))

    responseDataDeal({
      ctx,
      data,
      needCache: false
    })

  })

module.exports = router