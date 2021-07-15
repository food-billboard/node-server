const { mediaSchedule } = require('./media')
const { tagSchedule } = require('./tag')
const { movieSchedule } = require('./movie')
const { rankSchedule } = require('./rank')
const { browserSchedule } = require('./browser')
const { feedbackSchedule } = require('./feedback')
const { behaviourSchedule } = require('./behaviour')
const { unLoginChatUserSchedule, unGenerateChatUserSchedule } = require('./unlogin-chat-user')
const { notUseMemberSchedule } = require('./members')
const { notUseFriendsSchedule } = require('./friends')

function schedule() {
  //媒体资源定时器
  //0  0  20  *  *  7
  mediaSchedule()
  //数据标签定时器
  //0  0  20  *  *  6
  tagSchedule()
  //无用数据删除
  //0  0  22  *  *  5
  movieSchedule()
  //排行榜资源更新
  //0  0  18  *  *  7
  rankSchedule()
  //浏览记录定时清除
  //0  0  19  *  *  7
  browserSchedule()
  //反馈任务定时清除
  //0  0  23  *  *  7
  feedbackSchedule()
  //操作历史定时清除
  //0  0  24  *  *  7
  behaviourSchedule()
  //聊天游客数据定时清除
  //0  0  23  *  *  *
  unLoginChatUserSchedule()
  //聊天普通用户生成成员信息
  //0  0  22  *  *  *
  unGenerateChatUserSchedule()
  //无效成员定时删除审查
  //0 5 24 * * 7
  notUseMemberSchedule()
  //无效好友定时删除审查
  //0 10 24 * * 7
  notUseFriendsSchedule()
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