const nodeSchedule = require('node-schedule')
const chalk = require('chalk')
const Day = require('dayjs')
const { log4Error } = require('@src/config/winston')
const { MemberModel, UserModel } = require('../../mongodb/mongo.lib')

function scheduleMethod() {
  console.log(chalk.yellow('无效成员定时删除审查'))

  UserModel.aggregate([
    {
      $project: {
        _id: 1
      }
    }
  ])
  .then(userList => {
    return MemberModel.aggregate([
      {
        $match: {
          user: {
            $type: 7
          }
        }
      },
      {
        $project: {
          _id: 1,
          user: 1,
        }
      }
    ])
    .then(data => {
      const needDeleteMember = data.filter(item => {
        return !userList.some(user => user._id && item.user.equals(user._id))
      })
      return MemberModel.deleteMany({
        _id: {
          $in: needDeleteMember.map(item => item._id)
        }
      })
    })
  })
  .catch(err => {
    log4Error({
      __request_log_id__: '无效成员定时删除审查'
    }, err)
    console.log(chalk.red('部分任务执行失败: ', JSON.stringify(err)))
  })

}

const notUseMemberSchedule = () => {

  const schedule = nodeSchedule.scheduleJob('0 5 24 * * 7', scheduleMethod)

}

module.exports = {
  notUseMemberSchedule,
}