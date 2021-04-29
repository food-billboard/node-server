const nodeSchedule = require('node-schedule')
const chalk = require('chalk')
const Day = require('dayjs')
const { log4Error } = require('@src/config/winston')
const { FeedbackModel } = require('../../mongodb/mongo.lib')
const { FEEDBACK_STATUS } = require('../../constant')

function scheduleMethod() {

  console.log(chalk.yellow('反馈记录定时删除'))

  FeedbackModel.deleteMany({
    updatedAt: {
      $gte: Day().subtract(30, 'd').toDate(),
    },
    status: FEEDBACK_STATUS.DEAL,
  })
  .catch(err => {
    console.log(err)
    log4Error({
      __request_log_id__: '反馈记录定时删除'
    }, err)
  })

}

const feedbackSchedule = async () => {
  const schedule = nodeSchedule.scheduleJob('0  0  23  *  *  7', scheduleMethod)
}

module.exports = {
  feedbackSchedule
}