const nodeSchedule = require('node-schedule')
const chalk = require('chalk')
const { log4Error } = require('@src/config/winston')
const { MemberModel, UserModel } = require('../../mongodb/mongo.lib')

function scheduleMethod() {
  console.log(chalk.yellow('聊天普通用户生成成员信息定时审查'))

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
      const needGenerateUser = userList.filter(item => {
        return !data.some(member => member.user && member.user.equals(item._id))
      })
      return Promise.all(needGenerateUser.map(item => {
        const { _id } = item 
        const model = new MemberModel({
          user: _id,
        })
        return model.save()
      }))
    })
  })
  .catch(err => {
    log4Error({
      __request_log_id__: '聊天普通用户生成成员信息定时审查'
    }, err)
    console.log(chalk.red('部分任务执行失败: ', JSON.stringify(err)))
  })

}

const unGenerateChatUserSchedule = () => {

  const schedule = nodeSchedule.scheduleJob('0  0  22  *  *  *', scheduleMethod)

}

module.exports = {
  unGenerateChatUserSchedule
}