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
const { MEDIA_STATUS, STATIC_FILE_PATH_NO_WRAPPER } = require('../../constant')

/** 
 * 将过期的媒体资源删除
*/

async function scheduleMethod({
  test=false
}={}) {

  console.log(chalk.yellow(CacheJson.expireMediaSchedule.description))

  return Promise.all([
    ImageModel,
    VideoModel,
    OtherMediaModel
  ].map(async (model) => {
    return model.aggregate([
      {
        $match: {
          expire: {
            $lte: Date(),
          } 
        }
      }
    ])
    .then(async (data) => {
      return Promise.all([
        model.deleteMany({
          _id: {
            $in: data.map(item => item._id)
          }
        }),
        fs.remove(data.map(item => {
          return path.join(STATIC_FILE_PATH_NO_WRAPPER, item.src)
        }))
      ])
    })
  }))
  .catch(err => {
    !!test && log4Error({
      __request_log_id__: CacheJson.expireMediaSchedule.description
    }, err)
  })

}

const unUseMediaSchedule = () => {
  const { name, time } = CacheJson.expireMediaSchedule 
  const schedule = nodeSchedule.scheduleJob(name, time, scheduleMethod)
  return schedule 
}

module.exports = {
  schedule: unUseMediaSchedule,
  scheduleMethod
}