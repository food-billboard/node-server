const nodeSchedule = require('node-schedule')
const chalk = require('chalk')
const { Types: { ObjectId } } = require('mongoose')
const { log4Error } = require('@src/config/winston')
const CacheJson = require('../cache.json')
const { UserModel } = require('../../mongodb/mongo.lib')
const { ROLES_NAME_MAP } = require('../../constant')
const { encoded } = require('../../token')

/**
 * 初始化一个admin账号
 */

function scheduleMethod({
  test=false
}={}) {

  console.log(chalk.yellow('初始化admin账号'))

  return UserModel.findOne({
    // roles: {
    //   $in: [ROLES_NAME_MAP.SUPER_ADMIN]
    // }
    _id: ObjectId('5edb3c7b4f88da14ca419e61')
  })
  .select({
    _id: 1
  })
  .exec()
  .then(data => {
    if(data) return 
    const mobile = '18358995425'
    const password = '8'.repeat(8)
    const encodedPwd = encoded(password)
    const user = new UserModel({
      mobile,
      email: `${mobile}@163.com`,
      password: encodedPwd,
      username: 'admin',
      avatar: ObjectId('5edb3c7b4f88da14ca419e61'),
      hot: 0,
      fans: [],
      attentions: [],
      issue: [],
      glance: [],
      comment: [],
      store: [],
      rate: [],
      allow_many: false,
      status: 'SIGNOUT',
      roles: [ ROLES_NAME_MAP.SUPER_ADMIN ]
    })
    return user.save()
  })
  .catch(err => {
    console.log(err)
    !!test && log4Error({
      __request_log_id__: '初始化admin账号'
    }, err)
  })

}

scheduleMethod()

const initialAdminSchedule = () => {
  const { name, time } = CacheJson.initialAdminSchedule
  const schedule = nodeSchedule.scheduleJob(name, time, scheduleMethod)
  return schedule
}

module.exports = {
  schedule: initialAdminSchedule,
  scheduleMethod
}