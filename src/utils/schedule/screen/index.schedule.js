const nodeSchedule = require('node-schedule')
const chalk = require('chalk')
const CacheJson = require('../cache.json')
const { log4Error } = require('@src/config/winston')
const { ScreenPoolUtil } = require('@src/router/screen/router/save-pool/component-util/history')

/** 
 * 无引用大屏保存缓存定时清除
 * 超过有效时间的大屏缓存自动清除
*/

function scheduleMethod({
  test=false
}={}) {
  console.log(chalk.yellow('无引用大屏保存缓存定时清除'))

  try {
    ScreenPoolUtil.clear()
  }catch(err) {
    !!test && log4Error({
      __request_log_id__: '无引用大屏保存缓存定时清除'
    }, err)
    console.log(chalk.red('无引用大屏保存缓存定时清除，部分任务执行失败: ', JSON.stringify(err)))
  }

}

const unUseScreenSchedule = () => {

  const { name, time } = CacheJson.unUseScreenSchedule

  const schedule = nodeSchedule.scheduleJob(name, time, scheduleMethod)

  return schedule 

}

module.exports = {
  schedule: unUseScreenSchedule,
  scheduleMethod
}