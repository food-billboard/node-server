const nodeSchedule = require('node-schedule')
const chalk = require('chalk')
const CacheJson = require('../cache.json')
const { log4Error } = require('@src/config/winston')
const {
  LongTimeTaskModel
} = require('../../mongodb/mongo.lib')
const {
  TASK_STATUS
} = require('../../constant')
const dayjs = require('dayjs')

/** 
 * 删除耗时任务执行记录
*/

function scheduleMethod({
  test = false
} = {}) {
  console.log(chalk.yellow('删除耗时任务执行记录'))

  try {
    return LongTimeTaskModel.deleteMany({
      $or: [
        {
          status: TASK_STATUS.SUCCESS,
          deal_time: {
            $gte: dayjs().subtract(1, 'hour')
          }
        },
        {
          status: TASK_STATUS.FAIL,
          deal_time: {
            $gte: dayjs().subtract(5, 'hour')
          }
        }
      ]
    })
  } catch (err) {
    !!test && log4Error({
      __request_log_id__: '删除耗时任务执行记录'
    }, err)
    console.log(chalk.red('删除耗时任务执行记录，部分任务执行失败: ', JSON.stringify(err)))
  }

}

const taskMemorySchedule = () => {

  const { name, time } = CacheJson.taskMemorySchedule

  const schedule = nodeSchedule.scheduleJob(name, time, scheduleMethod)

  return schedule

}

module.exports = {
  schedule: taskMemorySchedule,
  scheduleMethod
}