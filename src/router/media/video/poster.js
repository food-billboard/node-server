const Router = require('@koa/router')
const { Types: { ObjectId } } = require("mongoose")
const fs = require('fs-extra')
const { exec } = require("child_process")
const path = require("path")
const { 
  VideoModel, 
  ImageModel, 
  dealErr, 
  responseDataDeal, 
  Params, 
  verifyTokenToData, 
  loginAuthorization, 
  MEDIA_AUTH, 
  notFound, 
  STATIC_FILE_PATH, 
  STATIC_FILE_PATH_NO_WRAPPER,
  MEDIA_ORIGIN_TYPE, 
  MEDIA_STATUS,
  fileEncoded,
  FFMPEG_VERSION
} = require('@src/utils')

const router = new Router()

router
.use(loginAuthorization())
.put("/", async (ctx) => {

  const check = Params.body(ctx, {
    name: '_id',
    validator: [
      data => ObjectId.isValid(data)
    ]
  })

  if(check) return

  const { name, origin_type, auth, time="00:00:10", overlap=false } = ctx.request.body 
  const mime = "image/jpg"
  const suffix = ".jpg"
  let posterName = name 
  let tempPosterFileName = ""
  let fileSize = 0 

  const [ _id ] = Params.sanitizers(ctx.request.body, {
    name: '_id',
    sanitizers: [
      data => ObjectId(data)
    ]
  })

  const [, token] = verifyTokenToData(ctx)

  const { id } = token

  let posterId 
  let posterSrc 

  let data = await VideoModel.findOne({
    _id,
    $or: [
      {
        origin: ObjectId(id)
      },
      {
        white_list: {
          $in: [
            ObjectId(id)
          ]
        }
      },
      {
        auth: MEDIA_AUTH.PUBLIC
      }
    ]
  })
  .select({
    _id: 1,
    src: 1,
    name: 1,
    poster: 1,
  })
  .exec()
  .then(notFound)
  .catch(dealErr(ctx))

  if(data._id && data.src) {
    const { poster } = data 
    if(!poster || !ObjectId.isValid(poster._id) || overlap) {
      data = await Promise.resolve()
      .then(_ => {
        const { src, poster } = data
        if(ObjectId.isValid(poster) && !overlap) return poster 
        posterName = posterName || data.name 
        posterName += "-temp"
        tempPosterFileName = path.join(STATIC_FILE_PATH, "/image", `/${posterName}${suffix}`)
        if(!fs.existsSync(path.join(STATIC_FILE_PATH_NO_WRAPPER, src))) {
          return notFound(false)
        }
        return data
      })
      .then(data => {
        // 视频截图  
        return new Promise((resolve, reject) => {
          const cmd = `docker run -v ${STATIC_FILE_PATH_NO_WRAPPER}:/run/project ${FFMPEG_VERSION} -ss ${time} -i ${path.join("/run/project", data.src)} -y -f image2 -t 0.001 ${path.join("/run/project/static/image", `/${posterName}${suffix}`)}`
          exec(cmd, function(err) {
            if(err) {
              reject({
                errMsg: err,
                status: 500 
              })
            }else {
              resolve()
            }
          })
        })
      })
      .then(_ => {
        // 文件加密
        let md5 
        return fs.stat(tempPosterFileName)
        .then(data => {
          fileSize = data.size 
          return fs.readFile(tempPosterFileName)
        })
        .then(data => {
          return fileEncoded(data)
        })
        .then(data => {
          md5 = data 
          return fs.rename(tempPosterFileName, path.join(STATIC_FILE_PATH, "/image", `/${md5}${suffix}`))
        })
        .then(_ => {
          return md5 
        })
      })
      .then(data => {
        const model = new ImageModel({
          src: `/static/image/${data}${suffix}`,
          name: posterName,
          origin_type: MEDIA_ORIGIN_TYPE[origin_type] || MEDIA_ORIGIN_TYPE.USER,
          auth: MEDIA_AUTH[auth] || MEDIA_AUTH.PUBLIC,
          origin: ObjectId(id),
          white_list: [
            ObjectId(id),
          ],
          info: {
            md5: data,
            size: fileSize,
            mime,
            status: MEDIA_STATUS.COMPLETE
          }
        })
    
        return model.save()
    
      })
      .then(data => {
        posterId = data._id 
        posterSrc = data.src 
        return VideoModel.updateOne({
          _id
        }, {
          $set: {
            poster: posterId
          }
        })
      })
      .then(_ => {
        return {
          data: {
            _id: posterId,
            src: posterSrc
          }
        }
      })
      .catch(dealErr(ctx)) 
    }else {
      data = {
        data: poster._id 
      }
    }
  }

  responseDataDeal({
    ctx,
    data,
    needCache: false
  })

})

module.exports = router