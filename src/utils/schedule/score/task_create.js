const nodeSchedule = require('node-schedule')
const chalk = require('chalk')
const { Types: { ObjectId } } = require('mongoose')
const dayjs = require('dayjs')
const CacheJson = require('../cache.json')
const { log4Error } = require('@src/config/winston')
const {
  UserModel,
  ScoreClassifyDesignModel,
  ScoreMemoryModel,
  ScoreClassifyModel
} = require('../../mongodb/mongo.lib')
const { SCORE_TASK_REPEAT_TYPE, SCORE_TYPE } = require('../../constant')

/** 
 * 创建每日积分任务
*/

const MAX_TASK_LIST = 10

async function scheduleMethod({
  test = false
} = {}) {

  console.log(chalk.yellow(CacheJson.createScoreTaskSchedule.description))

  try {
    // 是否节假日
    // TODO 
    const isHoliday = false
    // 星期几
    const weekDay = dayjs().day()
    // 每月的第几天
    const monthDay = dayjs().date()

    // 1. 找到所有需要生成任务的人
    const joinTaskUserList = await UserModel.aggregate([
      {
        $match: {
          join_task: true
        }
      },
      {
        $project: {
          _id: 1,
          birthday: 1,
        }
      }
    ])

    // 2. 获取所有人的定制信息
    const designTaskList = await ScoreClassifyDesignModel.aggregate([
      {
        $match: {
          target_user: {
            $in: joinTaskUserList.map(item => ObjectId(item._id))
          },
        }
      },
      {
        $project: {
          holiday: 1,
          target_user: 1,
          classify: 1,
          repeat_type: 1,
          repeat: 1,
          max_age: 1,
          min_age: 1,
        }
      }
    ])
    const filterDesignTaskList = designTaskList.filter(item => {
      return item.holiday === isHoliday && (item.repeat_type === SCORE_TASK_REPEAT_TYPE.WEEK ? item.repeat.includes(weekDay) : item.repeat.includes(monthDay))
    })

    // 3. 针对每一个人进行定制信息获取
    for (let index = 0; index < joinTaskUserList.length; index++) {
      const { _id: userId, birthday } = joinTaskUserList[index]
      const age = dayjs().diff(dayjs(birthday), 'year') + 1
      const createTaskList = []
      const targetUserDesignList = filterDesignTaskList.filter(item => {
        const { max_age, min_age } = item
        return item.target_user === userId && age <= max_age && age >= min_age
      })

      createTaskList.push(...targetUserDesignList.slice(0, MAX_TASK_LIST))

      // 任务不够则随机补足
      if (createTaskList.length < MAX_TASK_LIST) {
        const restCreateList = await ScoreClassifyModel.aggregate([
          {
            $match: {
              _id: {
                $nin: designTaskList.map(item => ObjectId(item.classify))
              }
            }
          },
          { 
            $sample: { 
              size: MAX_TASK_LIST - createTaskList.length 
            } 
          },
          {
            $project: {
              _id: 1,
              content: 1,
              description: 1,
              title: 1,
              menu_type: 1,
              createdAt: 1,
              updatedAt: 1,
            }
          }
        ])
        createTaskList.push(...restCreateList)
      }

      // 生成任务
      for (let subIndex = 0; subIndex < createTaskList.length; subIndex++) {
        const { classify } = createTaskList[subIndex]
        const model = new ScoreMemoryModel({
          date: dayjs().toDate(),
          target_user: ObjectId(userId),
          // 积分分数
          target_score: 0,
          // 积分类型
          score_type: SCORE_TYPE.TODO,
          // 积分人
          // create_user: 'todo',
          // 积分分类id
          target_classify: ObjectId(classify),
        })
        await model.save()
      }

    }
  } catch (err) {
    console.error(err)
    !test && log4Error({
      __request_log_id__: CacheJson.createScoreTaskSchedule.description
    }, err)
  }

}

const createScoreTaskSchedule = () => {
  const { name, time } = CacheJson.createScoreTaskSchedule
  const schedule = nodeSchedule.scheduleJob(name, time, scheduleMethod)
  return schedule
}

module.exports = {
  schedule: createScoreTaskSchedule,
  scheduleMethod
}