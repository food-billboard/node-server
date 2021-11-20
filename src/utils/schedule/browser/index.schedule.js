const nodeSchedule = require('node-schedule')
const chalk = require('chalk')
const CacheJson = require('../cache.json')
const { userDeal } = require('./user')
const { specialDeal } = require('./special')
const { log4Error } = require('@src/config/winston')

function scheduleMethod({
  test=false
}={}) {

  console.log(chalk.yellow('浏览记录定时删除'))

  Promise.allSettled([
    userDeal(),
    specialDeal()
  ])
  .catch(err => {
    !!test && log4Error({
      __request_log_id__: '浏览记录定时删除'
    }, err)
  })

}

const browserSchedule = () => {
  const { name, time } = CacheJson.browserSchedule
  const schedule = nodeSchedule.scheduleJob(name, time, scheduleMethod)
  return schedule 
}

module.exports = {
  schedule: browserSchedule,
  scheduleMethod
}