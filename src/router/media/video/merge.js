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
  TASK_STATUS,
  FFMPEG_VERSION,
  isRaspberry,
  STATIC_FILE_PATH_NO_WRAPPER,
  fileAsyncMd5,
  MEDIA_STATUS
} = require('@src/utils')
const { longTimeTaskCreate, updateLongTimeTask } = require('../../customer/task/utils')

const router = new Router()

router
  .use(loginAuthorization())
  // 合并视频
  // ! 目前合并视频仅支持是同一尺寸同一编码的视频
  .post("/", async (ctx) => {

    const check = Params.body(ctx, {
      name: '_id',
      validator: [
        data => data.split(',').every(item => ObjectId.isValid(item))
      ]
    })

    if (check) return

    const [, token] = verifyTokenToData(ctx)

    const { id } = token

    const {
      // 以下是不等待接口返回需要的字段
      page,
      app,
    } = ctx.request.body

    const [_id] = Params.sanitizers(ctx.request.body, {
      name: '_id',
      sanitizers: [
        data => data.split(',').map(item => ObjectId(item))
      ]
    })
    async function longTimeFunction(data) {
      const newFileName = Date.now() + '-video-merge' + '.mp4'
      const newFilePath = path.join(STATIC_FILE_PATH_NO_WRAPPER, '/static/video', newFileName)
      const filePathList = data.map(item => {
        const { src } = item
        return `file '${path.join("/run/project", src)}'`
      }).join('\n')

      return new Promise((resolve, reject) => {
        let cmd = ''
        // 树莓派环境
        if (isRaspberry()) {
          cmd = `bash -c "echo -e \"${filePathList}\" | ffmpeg -f concat -safe 0 -i - -c copy ${path.join(STATIC_FILE_PATH_NO_WRAPPER, "/static/video", newFileName)}"`
        } else {
          cmd = `docker run --rm -v ${STATIC_FILE_PATH_NO_WRAPPER}:/run/project ${FFMPEG_VERSION} \
  bash -c "echo -e \"${filePathList}\" | ffmpeg -f concat -safe 0 -i - -c copy ${path.join(STATIC_FILE_PATH_NO_WRAPPER, "/static/video", newFileName)}"`
        }
        exec(cmd, function (err) {
          if (err) {
            reject({
              errMsg: err,
              status: 500
            })
          } else {
            resolve()
          }
        })
      })
        .then(async () => {
          const stats = await fs.stat(newFilePath);
          const md5 = await fileAsyncMd5(newFilePath)
          const model = new VideoModel({
            expire: dayjs().add(1, 'day').toDate(),
            file_name: newFileName,
            description: '',
            name: newFileName,
            src: path.join('/static', 'video', `${md5}.mp4`),
            origin_type: MEDIA_ORIGIN_TYPE.USER,
            origin: id,
            auth: MEDIA_AUTH.PUBLIC,
            info: {
              md5: md5,
              complete: [],
              chunk_size: 1024 * 1024 * 5,
              size: stats.size,
              mime: 'video/mp4',
              status: MEDIA_STATUS.COMPLETE
            },
          })
          return model.save()
        })
        .then(data => data.src)

    }

    const data = await VideoModel.aggregate([
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
        if (page && app) {
          return longTimeTaskCreate({
            page,
            app,
            userId: id,
            method: 'POST',
            url: '/api/media/video/merge',
            schema: JSON.stringify([
              {
                label: '_id',
                value: _id,
                type: 'string',
                required: true
              }
            ]),
          })
            .then(async (model) => {
              const { _id } = model
              longTimeFunction(data)
                .then((data) => {
                  return updateLongTimeTask(_id.toString(), {
                    status: TASK_STATUS.SUCESS,
                    response: JSON.stringify(data),
                    deal_time: new Date()
                  })
                })
                .catch(err => {
                  return updateLongTimeTask(_id.toString(), {
                    status: TASK_STATUS.FAIL,
                    error_info: err.toString(),
                    deal_time: new Date()
                  })
                })
              return _id
            })
        } else {
          return longTimeFunction(data)
        }
      })
      .then(data => {
        return {
          data
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