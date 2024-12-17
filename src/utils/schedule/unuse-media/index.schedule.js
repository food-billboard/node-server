const nodeSchedule = require('node-schedule')
const chalk = require('chalk')
const CacheJson = require('../cache.json')
const { log4Error } = require('@src/config/winston')
const { 
  UserModel, 
  RoomModel, 
  MessageModel, 
  MovieModel, 
  ActorModel, 
  DirectorModel, 
  CommentModel, 
  RankModel, 
  ClassifyModel, 
  VideoModel, 
  FeedbackModel,
  ImageModel,
  ScreenModelModal,
  ScreenModal
} = require('../../mongodb/mongo.lib')
const { MEDIA_STATUS } = require('../../constant')

/** 
 * 将没有任何引用的媒体资源删除
*/

function imageSchedule() {
  return ImageModel.aggregate([
    {
      $match: {
        "info.status": MEDIA_STATUS.COMPLETE 
      }
    }
  ])
  .then(async (data) => {
    let needDeleteList = [] 
    for(let i = 0; i < data.length; i ++) {
      const target = data[i]
      const { _id, src } = target 
      // feedback
      const feedbackData = await FeedbackModel.findOne({
        "content.video": _id 
      })
      .exec()
      if(feedbackData) {
        continue
      }

      // comment 
      const commentData = await CommentModel.findOne({
        "content.image": _id 
      })
      .exec()
      if(commentData) {
        continue
      }

      // movie 
      const movieData = await MovieModel.findOne({
        $or: [
          {
            images: _id 
          },
          {
            poster: _id 
          }
        ]
      })
      .exec()
      if(movieData) {
        continue
      } 

      // message 
      const messageData = await MessageModel.findOne({
        "content.image": _id 
      })
      .exec()
      if(messageData) {
        continue
      } 

      // user 
      const userData = await UserModel.findOne({
        avatar: _id 
      })
      .exec()
      if(userData) {
        continue
      } 

      // room 
      const roomData = await RoomModel.findOne({
        "info.avatar": _id 
      })
      .exec()
      if(roomData) {
        continue
      } 

      // actor 
      const actorData = await ActorModel.findOne({
        "other.avatar": _id 
      })
      .exec()
      if(actorData) {
        continue
      } 

      // director 
      const directorData = await DirectorModel.findOne({
        "other.avatar": _id 
      })
      .exec()
      if(directorData) {
        continue
      } 

      // classify 
      const classifyData = await ClassifyModel.findOne({
        icon: _id 
      })
      .exec()
      if(classifyData) {
        continue
      } 

      // rank  
      const rankData = await RankModel.findOne({
        icon: _id 
      })
      .exec()
      if(rankData) {
        continue
      } 

      // video  
      const videoData = await VideoModel.findOne({
        poster: _id 
      })
      .exec()
      if(videoData) {
        continue
      } 

      // screen 
      const screenData = await ScreenModal.findOne({
        $or: [
          {
            poster: {
              $regex: src, 
              $options: 'i'
            } 
          },
          {
            data: {
              $regex: src, 
              $options: 'i'
            } 
          }
        ]
      })
      .exec()
      if(screenData) {
        continue
      }

      // screen-model
      const screenModelData = await ScreenModelModal.findOne({
        $or: [
          {
            poster: {
              $regex: src, 
              $options: 'i'
            } 
          },
          {
            data: {
              $regex: src, 
              $options: 'i'
            } 
          }
        ]
      })
      .exec()
      if(screenModelData) {
        continue
      }

      needDeleteList.push(_id)
    }
    return needDeleteList
  })
  .then(data => {
    return ImageModel.deleteMany({
      _id: {
        $in: data 
      }
    })
  })
}

function videoSchedule() {
  return VideoModel.aggregate([
    {
      $match: {
        "info.status": MEDIA_STATUS.COMPLETE 
      }
    },
    {
      $project: {
        _id: 1 
      }
    }
  ])
  .then(async (data) => {
    let needDeleteList = [] 
    for(let i = 0; i < data.length; i ++) {
      const target = data[i]
      const { _id } = target 
      // feedback
      const feedbackData = await FeedbackModel.findOne({
        "content.video": _id 
      })
      .exec()
      if(feedbackData) {
        continue
      }

      // comment 
      const commentData = await CommentModel.findOne({
        "content.video": _id 
      })
      .exec()
      if(commentData) {
        continue
      }

      // movie 
      const movieData = await MovieModel.findOne({
        video: _id 
      })
      .exec()
      if(movieData) {
        continue
      } 

      // message 
      const messageData = await MessageModel.findOne({
        "content.video": _id 
      })
      .exec()
      if(messageData) {
        continue
      } 

      needDeleteList.push(_id)
    }
    return needDeleteList
  })
  .then(data => {
    return VideoModel.deleteMany({
      _id: {
        $in: data 
      }
    })
  })
}

function otherSchedule() {
  // * 目前没有用到这个文件类型的地方
  return [] 
}

function scheduleMethod({
  test=false
}={}) {

  // ? 暂时不要去删除文件
  return 

  console.log(chalk.yellow(CacheJson.unUseMediaSchedule.description))

  return Promise.all([
    imageSchedule(),
    videoSchedule(),
    otherSchedule() 
  ])
  .catch(err => {
    !!test && log4Error({
      __request_log_id__: CacheJson.unUseMediaSchedule.description
    }, err)
  })

}

scheduleMethod(true)

const unUseMediaSchedule = () => {
  const { name, time } = CacheJson.unUseMediaSchedule 
  const schedule = nodeSchedule.scheduleJob(name, time, scheduleMethod)
  return schedule 
}

module.exports = {
  schedule: unUseMediaSchedule,
  scheduleMethod
}