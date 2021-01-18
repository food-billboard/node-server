const path = require('path')
const fs = require('fs').promises
const nodeSchedule = require('node-schedule')
const chalk = require('chalk')
const { log4Error } = require('@src/config/winston')
const { STATIC_FILE_PATH, MEDIA_STATUS } = require('../constant')
const { ImageModel, VideoModel, OtherMediaModel } = require('../mongodb/mongo.lib')
const { rmdir } = require('../tool')

const MAX_KEEP_FILE_MILL = 30 * 24 * 60 * 60 * 1000

const mediaDeal = async ({
  path: folder,
  model
}) => {

  let files = []

  return fs.readdir(folder)
  .then(fileList => {
    files = fileList.map(file => path.join(folder, file))

    const now = new Date()

    return   model.deleteMany({
      $or: [
        {
          "info.status": MEDIA_STATUS.ERROR
        },
        {
          src: { $nin: files }
        },
        {
          $and: [
            {
              "info.status": MEDIA_STATUS.UPLOADING,
            },
            {
              updatedAt: {
                $lte: new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
              }
            }
          ]
        }
      ]
    })
  })
  .then(_ => {
    return model.aggregate([
      {
        $match: {
          src: { $in: files }
        }
      },
      {
        $project: {
          src: 1
        }
      }
    ])
  })
  .then(dataList => dataList.map(data => data.src))
  .then(dataList => Promise.allSettled(files.map(file => {

    if(dataList.includes(file)) return Promise.resolve()
    return fs.unlink(file)

  })))
  .catch(err => {
    log4Error({
      __request_log_id__: '媒体资源定时审查'
    }, err)
    console.log(chalk.red('部分任务执行失败: ', JSON.stringify(err)))
  })

}

//删除过期的临时文件
const templateFileDeal = async () => {
  const folder = path.join(STATIC_FILE_PATH, 'template')

  return fs.readdir(folder)
  .then(folderList => {
    
    return Promise.allSettled(folderList.map(subFolder => {
      return fs.stat(subFolder)
      .then(({  isFile, mtimeMs }) => {
        //文件直接删除
        if(isFile()) return fs.unlink(subFolder)

        const now = Date.now()

        return now - MAX_KEEP_FILE_MILL > mtimeMs ? Promise.resolve() : rmdir(subFolder)
        
      })
    }))

  })

}

const mediaSchedule = () => {

  const schedule = nodeSchedule.scheduleJob('0  0  20  *  *  7', function() {

    console.log(chalk.yellow('媒体资源定时审查'))

    //图片
    mediaDeal({
      path: path.join('static', 'image'),
      model: ImageModel
    })

    //视频
    mediaDeal({
      path: path.join(STATIC_FILE_PATH, 'video'),
      model: VideoModel
    })

    //其他
    mediaDeal({
      path: path.join(STATIC_FILE_PATH, 'other'),
      model: OtherMediaModel
    })

    //临时文件过期删除
    templateFileDeal()

  })

}

module.exports = {
  mediaSchedule
}