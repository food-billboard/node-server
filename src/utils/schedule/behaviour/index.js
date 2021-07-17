const nodeSchedule = require('node-schedule')
const chalk = require('chalk')
const { log4Error } = require('@src/config/winston')
const { BehaviourModel } = require('../../mongodb/mongo.lib')

/**
 * 将行为历史数据清除
 * 当数据大于2000条
 */

function scheduleMethod({
  test=false
}={}) {

  console.log(chalk.yellow('操作历史定时删除'))

  return Promise.all([
    BehaviourModel.aggregate([
      {
        $group: {
          _id: 1,
          count: {
            $sum: 1
          }
        }
      },
      {
        $project: {
          _id: 0,
          total: 1,
        }
      }
    ]),
    BehaviourModel.aggregate([
      {
        $project: {
          timestamps: 1,
          _id: 0,
        }
      }
    ]),
  ])
  .then(([total, data]) => {
    if(!total || !total.length || total[0].count < 2000) return 
    const target = data[data.length - 2000]
    if(!target) return 
    return BehaviourModel.deleteMany({
      timestamps: {
        $lte: target.timestamps
      }
    })
  })
  .catch(err => {
    console.log(err)
    !!test && log4Error({
      __request_log_id__: '操作历史定时删除'
    }, err)
  })

}

const behaviourSchedule = async () => {
  const schedule = nodeSchedule.scheduleJob('0  0  24  *  *  7', scheduleMethod)
}

module.exports = {
  behaviourSchedule,
  scheduleMethod
}