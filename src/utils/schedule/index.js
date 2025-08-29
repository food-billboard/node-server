const fs = require("fs-extra")
const path = require("path")
const { omit } = require("lodash")
const mime = require("mime")
const { SCHEDULE_STATUS } = require('../constant')
const { log4Error } = require('../../config/winston')
const { ScheduleModel } = require('../mongodb/mongo.lib')
const CacheJson = require('./default.cache.json')

const SCHEDULE_MAP = {}

// 拉取所有定时任务依赖文件
function requireAllSchedule(scheduleFileList, retryTimes=5) {
  try {
    return scheduleFileList.reduce((acc, schedule) => {
      const result = require(schedule)
      if(result.schedule) {
        acc.push(result.schedule)
      }
      return acc 
    }, [])
  }catch(err) {
    if(retryTimes > 0) return requireAllSchedule(scheduleFileList, retryTimes - 1)
    log4Error({ __request_log_id__: "requireAllSchedule" }, err)
    return []
  }
}

async function collectAllSchedule(dir=__dirname, currentRelativeDir=".", retryTimes=5) {
  try {
    const currentDir = dir
    const fileList = await fs.readdir(currentDir)
    let resultList = []
    for(let i = 0; i < fileList.length; i ++) {
      const target = fileList[i]
      const filePath = path.join(currentDir, target)
      const stat = await fs.stat(filePath)
      const nextRelativeDir = `${currentRelativeDir}/${target}`
      if(stat.isDirectory()) {
        const result = await collectAllSchedule(filePath, nextRelativeDir, retryTimes)
        resultList.push(...result)
      }else if(mime.getExtension(mime.getType(target)) === "js" && target.endsWith("schedule.js")) {
        resultList.push(nextRelativeDir)
      }
    }
    return resultList
  }catch(err) {
    if(retryTimes > 0) return collectAllSchedule("", ".", retryTimes - 1)
    log4Error({ __request_log_id__: "collectAllSchedule" }, err)
    return []
  }
}

// 重试重新生成对应的数据库数据
async function retryGenerateScheduleDatabase() {
  let times = 100 
  function generate() {
    return Promise.all(Object.entries(SCHEDULE_MAP).map(item => {
      const [ key, value ] = item
      return ScheduleModel.findOne({
        name: key 
      })
      .exec()
      .then(data => {
        if(!data) {
          const model = new ScheduleModel({
            name: value.name,
            time: value.time,
            description: value.description,
            status: SCHEDULE_STATUS.SCHEDULING 
          })
          return model.save() 
        }
      })
    }))
    .catch(err => {
      console.error(err)
      times -- 
      if(times > 0) return generate() 
    })
  }
  return generate() 
}

class Schedule {

  async init() {
    const scheduleFileList = await collectAllSchedule()
    const scheduleList = requireAllSchedule(scheduleFileList) || []
    for(let i = 0; i < scheduleList.length; i ++) {
      const schedule = scheduleList[i]
      const scheduleTask = schedule()
      const name = scheduleTask.name 
      SCHEDULE_MAP[name] = {
        name,
        schedule: scheduleTask,
        ...CacheJson[name]
      }
    }
    retryGenerateScheduleDatabase() 
  }

  async setScheduleConfig(name, value={}) {
    const newData = {
      ...SCHEDULE_MAP[name] || {},
      ...value
    }
    SCHEDULE_MAP[name] = newData
    CacheJson[name] = omit(newData, ["schedule"])

    await fs.writeFile(path.join(__dirname, "/cache.json"), JSON.stringify(CacheJson))
  }

  getScheduleConfig(name) {
    return SCHEDULE_MAP[name]
  }

  isScheduleExists(name) {
    return !!SCHEDULE_MAP[name]
  }

  formatTime(time) {
    return time.split(" ").map(item => item.trim()).join(" ")
  }

  isTimeValid(time) {
    const formatTime = this.formatTime(time)
    const TIME_VALID_MAP = [
      function(data) {
        const numberData = parseFloat(data)
        return numberData >= 0 && numberData <= 59
      },
      function(data) {
        const numberData = parseFloat(data)
        return numberData >= 0 && numberData <= 59
      },
      function(data) {
        const numberData = parseFloat(data)
        return numberData >= 0 && numberData <= 23
      },
      function(data) {
        const numberData = parseFloat(data)
        return numberData >= 1 && numberData <= 31
      },
      function(data) {
        const numberData = parseFloat(data)
        return numberData >= 1 && numberData <= 12
      },
      function(data) {
        const numberData = parseFloat(data)
        return numberData >= 0 && numberData <= 6
      },
    ]
    return !formatTime.split(" ").every(item => item.trim() === '*') && !Object.values(SCHEDULE_MAP).some(item => item.time === formatTime) && formatTime.split(" ").every((item, index) => {
      if(item === "*") return true 
      if(item.includes(".")) return false 
      return TIME_VALID_MAP[index](item)
    })
  }

  getScheduleList() {
    return Object.values(SCHEDULE_MAP).map(item => omit(item, ["schedule"]))
  }

  async changeScheduleTime(params={}) {
    const { name, time } = params
    const { schedule } = SCHEDULE_MAP[name]
    const result = schedule.schedule(time)
    return result 
  }

  async cancelSchedule(params={}) {
    const { name, time } = params
    const { schedule } = SCHEDULE_MAP[name]
    const result = schedule.cancel(time)
    return result 
  }

  async restartSchedule(params) {
    const { name, time } = params
    return await this.changeScheduleTime({
      name,
      time
    })
  }

  async dealSchedule(name) {
    const { schedule } = SCHEDULE_MAP[name]
    schedule.invoke()
    return true 
  }

  async resumeAllSchedule() {
    const defaultCache = require("./default.cache.json")
    await fs.writeFile(path.join(__dirname, "/cache.json"), JSON.stringify(defaultCache))
  }

}

require('./score/task_create').scheduleMethod()

const scheduleConstructor = new Schedule()

module.exports = {
  scheduleConstructor
}

/**
  * * * * * * *
  ┬ ┬ ┬ ┬ ┬ ┬
  │ │ │ │ │  |
  │ │ │ │ │ └ day of week (0 - 6) (0 is Sun)
  │ │ │ │ └───── month (1 - 12)
  │ │ │ └────────── day of month (1 - 31)
  │ │ └─────────────── hour (0 - 23)
  │ └──────────────────── minute (0 - 59)
  └───────────────────────── second (0 - 59, OPTIONAL)
 */