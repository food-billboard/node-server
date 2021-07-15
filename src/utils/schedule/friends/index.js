const nodeSchedule = require('node-schedule')
const chalk = require('chalk')
const Day = require('dayjs')
const { log4Error } = require('@src/config/winston')
const { MemberModel, FriendsModel, UserModel } = require('../../mongodb/mongo.lib')

function scheduleMethod() {
  console.log(chalk.yellow('无效好友定时删除审查'))

  Promise.all([
    UserModel.aggregate([
      {
        $project: {
          _id: 1
        }
      }
    ]),
    MemberModel.aggregate([
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
  ])
  .then(([userList, memberList]) => {
    return FriendsModel.aggregate([
      {
        $project: {
          _id: 1,
          user: 1,
        }
      }
    ])
    .then(friendList => {
      const needDeleteFriends = friendList.filter(item => {
        return !userList.some(user => user._id && item.user.equals(user._id))
      })
      return FriendsModel.deleteMany({
        _id: {
          $in: needDeleteFriends.map(item => item._id)
        }
      })
    })
  })
  .catch(err => {
    log4Error({
      __request_log_id__: '无效好友定时删除审查'
    }, err)
    console.log(chalk.red('部分任务执行失败: ', JSON.stringify(err)))
  })

}

const notUseFriendsSchedule = () => {

  const schedule = nodeSchedule.scheduleJob('0 10 24 * * 7', scheduleMethod)

}

module.exports = {
  notUseFriendsSchedule,
}