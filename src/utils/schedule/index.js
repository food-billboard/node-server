const fs = require("fs-extra")
const { omit } = require("lodash")
const { SCHEDULE_STATUS } = require('../constant')

const { mediaSchedule } = require('./media')
const { tagSchedule } = require('./tag')
const { movieSchedule } = require('./movie')
const { rankSchedule } = require('./rank')
const { browserSchedule } = require('./browser')
const { feedbackSchedule } = require('./feedback')
const { behaviourSchedule } = require('./behaviour')
const { unLoginChatUserSchedule, unGenerateChatUserSchedule } = require('./unlogin-chat-user')
const { notUseMemberSchedule } = require('./members')
const { notUseFriendsSchedule, friendsStatusChangeSchedule } = require('./friends')

const SCHEDULE_MAP = {}

function requireAllSchedule() {

  return []
}

class Schedule {

  init() {
    const scheduleList = requireAllSchedule()
    scheduleList.forEach(schedule => {
      const { name, schedule, ...nextScheduleData } = schedule()
      SCHEDULE_MAP[name] = {
        name,
        ...nextScheduleData
      }
    })
  }

  setScheduleConfig(name, value={}) {
    SCHEDULE_MAP[name] = {
      ...SCHEDULE_MAP[name] || {},
      ...value
    }
  }

  isScheduleExists(name) {
    return SCHEDULE_MAP[name]
  }

  isTimeValid(time) {
    return Object.values(SCHEDULE_MAP).some(item => item.time === time)
  }

  getScheduleList() {
    return Object.values(SCHEDULE_MAP).map(item => omit(item, ["schedule"]))
  }

  changeScheduleTime(params={}) {
    const { name, time } = params
    const { schedule } = SCHEDULE_MAP[name]
    const result = schedule.reschedule(time)
    if(result) {
      this.setScheduleConfig({ time })
    }
    return result 
  }

  cancelSchedule(params={}) {
    const { name } = params
    const { schedule, status } = SCHEDULE_MAP[name]
    if(status === SCHEDULE_STATUS.CANCEL) return true 
    const result = schedule.cancel(time)
    if(result) {
      this.setScheduleConfig({ time })
    }
    return result 
  }

  restartSchedule(params) {
    const { name } = params
    const { time, status } = SCHEDULE_MAP[name]
    if(status === SCHEDULE_STATUS.SCHEDULING) return true 
    return this.changeScheduleTime({
      name,
      time
    })
  }

}


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
  //0 20 24 * * *
  friendsStatusChangeSchedule()
}

const scheduleConstructor = new Schedule()

module.exports = {
  schedule,
  scheduleConstructor
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