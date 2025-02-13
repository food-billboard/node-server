const Router = require('@koa/router')
const { Types: { ObjectId } } = require("mongoose")
const fs = require('fs-extra')
const { exec } = require("child_process")
const path = require("path")
const { 
  VideoModel, 
  dealErr, 
  responseDataDeal, 
  Params, 
  verifyTokenToData, 
  loginAuthorization, 
  MEDIA_AUTH, 
  notFound, 
  STATIC_FILE_PATH, 
  MEDIA_ORIGIN_TYPE, 
  MEDIA_STATUS,
  fileEncoded,
  FFMPEG_VERSION,
  isRaspberry,
  STATIC_FILE_PATH_NO_WRAPPER
} = require('@src/utils')

const router = new Router()

router
.use(loginAuthorization())
// 合并视频
.post("/", async (ctx) => {

  const check = Params.body(ctx, {
    name: '_id',
    validator: [
      data => data.split(',').every(item => ObjectId.isValid(item))
    ]
  })

  if(check) return

  const { 
    
  } = ctx.request.body 

  const [ _id ] = Params.sanitizers(ctx.request.body, {
    name: '_id',
    sanitizers: [
      data => data.split(',').map(item => ObjectId(item))
    ]
  })

  let data = await VideoModel.aggregate([
    {
      $match: {
        _id: {
          $in: _id 
        }
      }
    },
    {
      $project: {
        src: 1,
        _id: 1
      }
    }
  ])
  .then(data => {
    const pathList = data.map(item => {
      const { src } = item
      const absolutePath = path.join(STATIC_FILE_PATH_NO_WRAPPER, src)
      return new Promise((resolve, reject) => {
        let cmd = ''
        // 树莓派环境
        if(isRaspberry()) {
          cmd = `ffmpeg -ss ${time} -i ${path.join(STATIC_FILE_PATH_NO_WRAPPER, data.src)} -y -f image2 -t 0.001 ${path.join(STATIC_FILE_PATH_NO_WRAPPER, "/static/image", `/${posterName}${suffix}`)}`
        }else {
          cmd = `docker run --rm -v ${STATIC_FILE_PATH_NO_WRAPPER}:/run/project ${FFMPEG_VERSION} -ss ${time} -i ${path.join("/run/project", data.src)} -y -f image2 -t 0.001 ${path.join("/run/project/static/image", `/${posterName}${suffix}`)}`
        }          
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
  })
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data,
    needCache: false
  })

})

module.exports = router