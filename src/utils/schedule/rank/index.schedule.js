const nodeSchedule = require('node-schedule')
const chalk = require('chalk')
const CacheJson = require('../cache.json')
const { log4Error } = require('@src/config/winston')
const { classifyDeal } = require('./classify')
const { staticDeal } = require('./static')
const { RankModel, MovieModel } = require('../../mongodb/mongo.lib')
const { rankOperation } = require('./utils')
const { parseData } = require('../../error-deal')

/** 
 * 更新排行榜数据
 * 删除 match_pattern字段 不合理 的数据(非数组|长度为0)
 * 删除 classify数据库 _id 字段中不存在的match_pattern中origin_id数据
 * 新增 classify数据库 _id 字段 在 match_pattern中origin_id 数据
 * 新增 静态排行榜数据 在 match_pattern 中 不存在的数据
 * 将最新匹配排行榜规则的电影添加至 match 字段
*/

async function findMatchMovieData() {
  let result 
  return RankModel.aggregate([
    {
      $project: {
        match_pattern:1,
        _id: 1
      }
    }
  ])
  .then(data => {
    result = data
    return Promise.all(result.map(item => {
      const { match_pattern } = item 
      const { filter } = rankOperation(match_pattern)
      return MovieModel.aggregate([
        {
          $match: filter
        },
        {
          $project: {
            _id: 1
          }
        }
      ])
      .then(parseData)
    }))
  })
  .then(movieData => {
    return Promise.all(result.map((item, index) => {
      const { _id } = item 
      return RankModel.updateOne({
        _id,
      }, {
        $set: {
          match: movieData[index]
        }
      })
    }))
  })
}

async function scheduleMethod({
  test=false
}={}) {

  console.log(chalk.yellow('排行榜资源定时更新'))

  let remove = []
  let add = []

  return RankModel.find({})
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
    remove.push(...static.remove, ...classify.remove)
    add.push(...static.add, ...classify.add)
    return Promise.all([
      RankModel.deleteMany({
        _id: { $in: remove }
      }),
      RankModel.insertMany(add)
    ])
  })
  .then(findMatchMovieData)
  .catch(err => {
    !!test && log4Error({
      __request_log_id__: '排行榜资源定时更新'
    }, err)
  })

}

const rankSchedule = () => {
  const { name, time } = CacheJson.rankSchedule

  const schedule = nodeSchedule.scheduleJob(name, time, scheduleMethod)

  return schedule 
}

module.exports = {
  schedule: rankSchedule,
  scheduleMethod
}