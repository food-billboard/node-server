const { mediaSchedule } = require('./media')
// const { tagSchedule } = require('./tag')
const { movieSchedule } = require('./movie')
const { rankSchedule } = require('./rank')
const { browserSchedule } = require('./browser')
const { feedbackSchedule } = require('./feedback')
const { behaviourSchedule } = require('./behaviour')

function schedule() {
  //媒体资源定时器
  mediaSchedule()
  //数据标签定时器
  // tagSchedule()
  //无用数据删除
  movieSchedule()
  //排行榜资源更新
  rankSchedule()
  //浏览记录定时清除
  browserSchedule()
  //反馈任务定时清除
  feedbackSchedule()
  //操作历史定时清除
  behaviourSchedule()
}

module.exports = {
  schedule
}

/**
  * * * * * * *
  ┬ ┬ ┬ ┬ ┬ ┬
  │ │ │ │ │  |
  │ │ │ │ │ └ day of week (0 - 7) (0 or 7 is Sun)
  │ │ │ │ └───── month (1 - 12)
  │ │ │ └────────── day of month (1 - 31)
  │ │ └─────────────── hour (0 - 23)
  │ └──────────────────── minute (0 - 59)
  └───────────────────────── second (0 - 59, OPTIONAL)
 */