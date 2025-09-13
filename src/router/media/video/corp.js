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
  MEDIA_ORIGIN_TYPE,
  MEDIA_STATUS,
  fileAsyncMd5,
  FFMPEG_VERSION,
  isRaspberry,
  STATIC_FILE_PATH_NO_WRAPPER,
  TASK_STATUS,
  throwLongTimeTaskErrorFunction
} = require('@src/utils')
const dayjs = require('dayjs')
const { longTimeTaskCreate, updateLongTimeTask } = require('../../customer/task/utils')

const router = new Router()

router
  .use(loginAuthorization())
  // 裁剪视频
  .post("/", async (ctx) => {

    const check = Params.body(ctx, {
      name: '_id',
      validator: [
        data => data.split(',').every(item => ObjectId.isValid(item))
      ]
    })

    if (check) return

    const {
      time,
      // 以下是不等待接口返回需要的字段
      page,
      app,
    } = ctx.request.body

    const [, token] = verifyTokenToData(ctx)

    const { id } = token

    const [_id] = Params.sanitizers(ctx.request.body, {
      name: '_id',
      sanitizers: [
        data => data.split(',').map(item => ObjectId(item))
      ]
    })

    async function longTimeFunction(data) {
      const { src } = data
      const absolutePath = path.join(STATIC_FILE_PATH_NO_WRAPPER, src)
      // 先创建数据库
      const databaseData = await Promise.all(time.map(item => {
        const [start, end] = item
        const templateFileName = Date.now() + start + end + '.mp4'
        const model = new VideoModel({
          expire: dayjs().add(1, 'hour').toDate(),
          file_name: templateFileName,
          description: '',
          name: templateFileName,
          src: 'template',
          origin_type: MEDIA_ORIGIN_TYPE.USER,
          origin: id,
          auth: MEDIA_AUTH.PUBLIC,
          info: {
            md5: 'template',
            complete: [],
            chunk_size: 1024 * 1024 * 5,
            size: 1,
            mime: 'video/mp4',
            status: MEDIA_STATUS.COMPLETE
          },
        })
        return model.save()
      }))

      return Promise.allSettled(time.map((item, index) => {
        const database = databaseData[index]
        const [_start, _end] = item
        const start = `${_start}.0000`
        const end = `${_end}.0000`
        return new Promise((resolve, reject) => {
          let cmd = ''
          // 树莓派环境
          const timeFilePath = path.join(absolutePath, '../', database.file_name)
          if (isRaspberry()) {
            cmd = `ffmpeg -ss ${start} -to ${end} -i ${absolutePath} -acodec copy -vcodec copy -c copy ${timeFilePath}`
          } else {
            cmd = `docker run --rm -v ${STATIC_FILE_PATH_NO_WRAPPER}:/run/project ${FFMPEG_VERSION} -ss ${start} -to ${end} -i ${path.join("/run/project", src)} -acodec copy -vcodec copy -c copy ${path.join("/run/project/static/video", `/${database.file_name}`)}`
          }
          exec(cmd, function (err) {
            if (err) {
              console.error(err)
              reject({
                errMsg: err,
                status: 500
              })
            } else {
              resolve({
                ...database,
                src: `/static/video/${database.file_name}`
              })
            }
          })
        })
      }))
        .then((result) => {
          return Promise.allSettled(result.map(async (item) => {
            if (item.status === 'rejected') return Promise.reject(item.reason)
            const { value } = item
            const { src, _id } = value
            const absolutePath = path.join(STATIC_FILE_PATH_NO_WRAPPER, src)
            const stats = await fs.stat(absolutePath);
            const md5 = await fileAsyncMd5(absolutePath)
            return VideoModel.updateOne({
              _id,
            }, {
              $set: {
                src: path.join('/static', 'video', `${md5}.mp4`),
                "info.size": stats.size,
                "info.md5": md5
              }
            })
              .then(() => {
                return item.value.src
              })
          }))
        })
    }

    let data = await VideoModel.findOne({
      _id
    })
      .select({
        _id: 1,
        src: 1
      })
      .exec()
      .then(notFound)
      .then(data => {
        if(page && app) {
          return longTimeTaskCreate({
            page,
            app,
            userId: id,
            method: 'POST',
            url: '/api/media/video/corp',
            schema: JSON.stringify([
              {
                label: '_id',      
                value: _id,
                type: 'string',
                required: true 
              },
              {
                label: 'time',      
                value: time,
                type: 'array',
                required: true 
              },
            ]),
          })
            .then(async (model) => {
              const { _id } = model
              throwLongTimeTaskErrorFunction(longTimeFunction, 1000 * 60 * 60, data)
                .then((data) => {
                  return updateLongTimeTask(_id.toString(), {
                    status: TASK_STATUS.SUCCESS,
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
        }else {
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