const Router = require('@koa/router')
const { Types: { ObjectId } } = require("mongoose")
const fs = require('fs-extra')
const { exec } = require("child_process")
const path = require("path")
const Mime = require('mime')
const {
  VideoModel,
  dealErr,
  responseDataDeal,
  Params,
  verifyTokenToData,
  loginAuthorization,
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

// 视频压缩

router
  .use(loginAuthorization())
  // 视频压缩
  .post("/", async (ctx) => {

    const check = Params.body(ctx, {
      name: '_id',
      validator: [
        data => data.split(',').every(item => ObjectId.isValid(item))
      ]
    })

    if (check) return

    const {
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
      return Promise.allSettled(data.map((item) => {
        const { src } = item
        const [filename] = src.split('/').slice(-1)
        const templateFilePath = `/static/video/template-${filename}`
        return new Promise((resolve, reject) => {
          let cmd = ''
          // 树莓派环境
          if (isRaspberry()) {
            cmd = `ffmpeg -i ${path.join(STATIC_FILE_PATH_NO_WRAPPER, src)} -vf "scale=1280:-2" ${path.join(STATIC_FILE_PATH_NO_WRAPPER, templateFilePath)}`
          } else {
            cmd = `docker run --rm -v ${STATIC_FILE_PATH_NO_WRAPPER}:/run/project ${FFMPEG_VERSION} -i ${path.join("/run/project", src)} -vf "scale=1280:-2" ${path.join("/run/project", templateFilePath)}`
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
                ...item,
                templateFilePath
              })
            }
          })
        })
      }))
        .then((result) => {
          return Promise.allSettled(result.map(async (item) => {
            if (item.status === 'rejected') return Promise.reject(item.reason)
            const { value } = item
            const { src, info, name, file_name = '', templateFilePath, _id, ...nextValue } = value
            const [filename] = src.split('/').slice(-1)
            const filenamePrefix = filename.split('.').slice(0, -1).join('.')
            const [fileSuffix] = filename.split('.').slice(-1)

            const absolutePath = path.join(STATIC_FILE_PATH_NO_WRAPPER, templateFilePath)
            const stats = await fs.stat(absolutePath);
            const md5 = await fileAsyncMd5(absolutePath)

            let newName = name
            if (newName.includes(info.md5)) {
              newName = newName.replace(info.md5, md5)
            }
            let newFilename = file_name
            if (newFilename.includes(info.md5)) {
              newFilename = newFilename.replace(info.md5, md5)
            }

            await fs.remove(path.join(STATIC_FILE_PATH_NO_WRAPPER, src))
            if (filenamePrefix === info.md5) {
              await fs.move(absolutePath, path.join(STATIC_FILE_PATH_NO_WRAPPER, '/static/video', `${md5}.${fileSuffix}`))
            }

            console.log({
              ...nextValue,
              name: newName,
              file_name: newFilename,
              src: newSrc,
              "info.size": stats.size,
              "info.md5": md5,
            }, value)

            return VideoModel.updateOne({
              _id,
            }, {
              $set: {
                ...nextValue,
                name: newName,
                file_name: newFilename,
                src: newSrc,
                "info.size": stats.size,
                "info.md5": md5,
              }
            })
              .then(() => {
                return newSrc
              })
          }))
        })
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
          _id: 1,
          src: 1,
          name: 1,
          file_name: 1,
          // md5 mime size 
          info: 1,
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
            url: '/api/media/video/compress',
            schema: JSON.stringify([
              {
                label: '_id',
                value: _id,
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