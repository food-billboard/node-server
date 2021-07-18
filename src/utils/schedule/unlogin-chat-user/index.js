const nodeSchedule = require('node-schedule')
const chalk = require('chalk')
const Day = require('dayjs')
const { log4Error } = require('@src/config/winston')
const { unGenerateChatUserSchedule } = require('./un-generate-user')
const { MemberModel, RoomModel } = require('../../mongodb/mongo.lib')

const MAX_TIMESTAMPS = 1000 * 24 * 60 * 60 * 7

/** 
 * 游客数据清除
 * 游客账号未注册 超过
*/

function scheduleMethod({ test=false }={}) {
  console.log(chalk.yellow('游客数据定时审查'))

  return MemberModel.aggregate([
    {
      $match: {
        user: {
          $not: {
            $type: 7
          }
        },
        updatedAt: {
          $lte: Day(Date.now() - MAX_TIMESTAMPS).toDate()
        }
      }
    },
    {
      $project: {
        _id: 1
      }
    }
  ])
  .then(data => {
    const members = data.map(item => item._id)
    return Promise.all([
      RoomModel.updateMany({
        members: {
          $in: members
        }
      }, {
        $pull: {
          members: {
            $each: members
          }
        }
      }),
      MemberModel.deleteMany({
        _id: {
          $in: members
        }
      })
    ])
  })
  .catch(err => {
    test && log4Error({
      __request_log_id__: '游客数据定时审查'
    }, err)
    console.log(chalk.red('部分任务执行失败: ', JSON.stringify(err)))
  })

}

const unLoginChatUserSchedule = () => {

  const schedule = nodeSchedule.scheduleJob('0  0  23  *  *  *', scheduleMethod)

}

module.exports = {
  unLoginChatUserSchedule,
  unGenerateChatUserSchedule,
  scheduleMethod,
  MAX_TIMESTAMPS
}