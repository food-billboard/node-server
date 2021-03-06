const nodeSchedule = require('node-schedule')
const chalk = require('chalk')
const { Types: { ObjectId } } = require('mongoose')
const { log4Error } = require('@src/config/winston')
const { parseData } = require('../error-deal')
const { MovieModel, UserModel } = require('../mongodb/mongo.lib')

const findUsers = async () => {

  return UserModel.find({})
  .select({
    _id: 1
  })
  .exec()
  .then(parseData)
  .then(data => data.map(item => item._id))
  // .catch(err => {
  //   console.log(chalk.red('定时任务用户查找错误: ' + JSON.stringify(err)))
  //   return []
  // })

}

const findMovies = async () => {

  return MovieModel.find({})
  .select({
    _id: 1
  })
  .exec()
  .then(parseData)
  .then(data => data.map(item => item._id))
  .catch(err => {
    console.log(chalk.red('定时任务电影查找错误: ' + JSON.stringify(err)))
    return []
  })

}

const removeMovies = async (userList) => {

  return MovieModel.deleteMany({
    author: { $nin: userList }
  })
  .catch(err => {
    console.log(chalk.red('定时任务电影删除错误: ' + JSON.stringify(err)))
  })

}

function scheduleMethod() {
  console.log(chalk.magenta('无用资源删除定时审查'))

  //当前简单实用评论当做tag
  findUsers()
  .then(removeMovies)
  // .then(findMovies)
  // .then(removeMovieMapping)
  // .then(results => {
  //   const errors = results.filter(result => result.status === "rejected")
  //   if(!!errors.length) return Promise.reject({ errMsg: 'tag设置部分错误', list: errors })
  // })
  .catch(err => {
    console.log(err)
    console.log(chalk.red('无用资源删除定时审查失败: ', JSON.stringify(err)))
    log4Error({
      __request_log_id__: '无用资源删除定时审查id'
    }, err)
  })
}

const movieSchedule = () => {

  const schedule = nodeSchedule.scheduleJob('0  0  22  *  *  5', scheduleMethod)
}

module.exports = {
  movieSchedule
}