const nodeSchedule = require('node-schedule')
const chalk = require('chalk')
const Day = require('dayjs')
const CacheJson = require('../cache.json')
const { log4Error } = require('@src/config/winston')
const { FeedbackModel } = require('../../mongodb/mongo.lib')
const { FEEDBACK_STATUS } = require('../../constant')

/** 
 * 将已处理的反馈删除
 * 反馈时间超过30天
*/

function scheduleMethod({
  test=false
}={}) {

  console.log(chalk.yellow('反馈记录定时删除'))

  return FeedbackModel.deleteMany({
    updatedAt: {
      $gte: Day().subtract(30, 'd').toDate(),
    },
    status: FEEDBACK_STATUS.DEAL,
  })
  .catch(err => {
    !!test && log4Error({
      __request_log_id__: '反馈记录定时删除'
    }, err)
  })

}

const feedbackSchedule = () => {
  const { name, time } = CacheJson.feedbackSchedule
  const schedule = nodeSchedule.scheduleJob(name, time, scheduleMethod)
  return schedule 
}

module.exports = {
  schedule: feedbackSchedule,
  scheduleMethod
}