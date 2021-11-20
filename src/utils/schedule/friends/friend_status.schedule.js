const nodeSchedule = require('node-schedule')
const chalk = require('chalk')
const CacheJson = require('../cache.json')
const { log4Error } = require('@src/config/winston')
const { FriendsModel } = require('../../mongodb/mongo.lib')
const { FRIEND_STATUS } = require('../../constant')

const SPACE = 1000 * 24 * 60 * 60 * 30

/** 
 * 好友状态修改
 * 好友状态为 AGREE
 * 时间距离现在超过 SPACE
*/

async function scheduleMethod({
  test=false
}={}) {
  console.log(chalk.yellow('好友状态定时审查'))
  return FriendsModel.aggregate([
    {
      $match: {
        friends: {
          $elemMatch: {
            $and: [
              {
                timestamps: {
                  $lte: Date.now() - SPACE
                }
              },
              {
                status: FRIEND_STATUS.AGREE
              }
            ]
          }
        }
      }
    },
    {
      $project: {
        friends: 1,
        _id: 1
      }
    }
  ])
  .then(data => {
    const newData = data.map(item => {
      const { _id, friends } = item 
      return {
        _id,
        friends: friends.map(item => {
          const { timestamps, status, ...nextItem } = item
          if(status !== FRIEND_STATUS.AGREE || Date.now() - SPACE < timestamps ) return item  
          return {
            ...item,
            status: FRIEND_STATUS.NORMAL
          }
        })
      }
    })
    return Promise.all(newData.map(item => {
      const { _id, friends } = item
      return FriendsModel.updateOne({
        _id
      }, {
        $set: {
          friends
        }
      }) 
    }))
  })
  .catch(err => {
    test && log4Error({
      __request_log_id__: '好友状态定时审查'
    }, err)
    console.log(chalk.red('部分任务执行失败: ', JSON.stringify(err)))
  })

}

const friendsStatusChangeSchedule = () => {

  const { name, time } = CacheJson.friendsStatusChangeSchedule

  const schedule = nodeSchedule.scheduleJob(name, time, scheduleMethod)

  return schedule 
}

module.exports = {
  schedule: friendsStatusChangeSchedule,
  scheduleMethod,
  SPACE
}