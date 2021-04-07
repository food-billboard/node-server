const nodeSchedule = require('node-schedule')
const chalk = require('chalk')
const { log4Error } = require('@src/config/winston')
const { classifyDeal } = require('./classify')
const { staticDeal } = require('./static')
const { RankModel } = require('../../mongodb/mongo.lib')

const rankSchedule = async () => {

  const schedule = nodeSchedule.scheduleJob('0  0  18  *  *  7', function() {

    console.log(chalk.yellow('排行榜资源定时更新'))

    let remove = []
    let add = []

    RankModel.find({})
    .select({
      match_pattern: 1,
      name: 1
    })
    .exec()
    .then(data => data.filter(rank => {
      const { _id, match_pattern } = rank
      const rm = !Array.isArray(match_pattern) || !match_pattern.length
      if(rm) remove.push(_id)
      return !rm
    }))
    .then(data => Promise.all([
      //静态排行
      staticDeal(data),
      //分类排行
      classifyDeal(data)
    ]))
    .then(([static, classify]) => {
      remove.push(...static.remove, classify.remove)
      add.push(...static.add, ...classify.add)
      return Promise.all([
        RankModel.deleteMany({
          _id: { $in: remove }
        }),
        RankModel.insertMany(add)
      ])
    })
    .catch(err => {
      log4Error({
        __request_log_id__: '排行榜资源定时更新'
      }, err)
    })

  })

}

module.exports = {
  rankSchedule
}