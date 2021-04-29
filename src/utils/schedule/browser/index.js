const nodeSchedule = require('node-schedule')
const chalk = require('chalk')
const { userDeal } = require('./user')
const { specialDeal } = require('./special')
const { log4Error } = require('@src/config/winston')

function scheduleMethod() {

  console.log(chalk.yellow('浏览记录定时删除'))

  Promise.allSettled([
    userDeal(),
    specialDeal()
  ])
  .catch(err => {
    console.log(err)
    log4Error({
      __request_log_id__: '浏览记录定时删除'
    }, err)
  })

}

const browserSchedule = async () => {
  const schedule = nodeSchedule.scheduleJob('0  0  19  *  *  7', scheduleMethod)
}

module.exports = {
  browserSchedule
}