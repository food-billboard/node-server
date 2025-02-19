const nodeSchedule = require('node-schedule')
const chalk = require('chalk')
const fs = require('fs-extra')
const path = require('path')
const CacheJson = require('../cache.json')
const { log4Error } = require('@src/config/winston')
const {
  VideoModel,
  OtherMediaModel,
  ImageModel,
} = require('../../mongodb/mongo.lib')
const { STATIC_FILE_PATH_NO_WRAPPER, STATIC_FILE_PATH } = require('../../constant')

/** 
 * 将数据库中没有记录的媒体资源删除
*/

async function scheduleMethod({
  test = false
} = {}) {

  console.log(chalk.yellow(CacheJson.noDatabaseMediaSchedule.description))

  return Promise.all([
    { dirPath: 'image', model: ImageModel, },
    { dirPath: 'video', model: VideoModel },
    { dirPath: 'other', model: OtherMediaModel }
  ].map(async (item) => {
    const { dirPath, model } = item
    const absoluteDirpath = path.join(STATIC_FILE_PATH, dirPath)
    const dirList = await fs.readdir(absoluteDirpath)

    return model.find({})
      .then(async (data) => {
        const noDatabaseDirList = dirList.filter(file => {
          return !data.some(item => item.src.includes(file))
        })
        return Promise.allSettled(noDatabaseDirList.map(item => {
          return fs.remove(path.join(absoluteDirpath, item))
        }))
      })
  }))
    .catch(err => {
      !!test && log4Error({
        __request_log_id__: CacheJson.noDatabaseMediaSchedule.description
      }, err)
    })

}

const noDatabaseMediaSchedule = () => {
  const { name, time } = CacheJson.noDatabaseMediaSchedule
  const schedule = nodeSchedule.scheduleJob(name, time, scheduleMethod)
  return schedule
}

module.exports = {
  schedule: noDatabaseMediaSchedule,
  scheduleMethod
}