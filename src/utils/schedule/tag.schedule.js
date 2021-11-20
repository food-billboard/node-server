const nodeSchedule = require('node-schedule')
const chalk = require('chalk')
const { Types: { ObjectId } } = require("mongoose")
let nodejieba
try {
  nodejieba = require('nodejieba')
}catch(err) {
  console.log(chalk.red('当前不支持nodejieba包'))
}
const CacheJson = require('./cache.json')
const { log4Error } = require('@src/config/winston')
const { COMMENT_SOURCE_TYPE, EXTRACT_KEYWORD_TOP_N } = require('../constant')
const { MovieModel, TagModel, CommentModel } = require('../mongodb/mongo.lib')


const collectComment = async (movieId) => {
  let match = {
    source_type: COMMENT_SOURCE_TYPE.movie,
  }
  if(!!movieId) match.source = {
    $in: movieId
  }
  return CommentModel.aggregate([
    {
      $match: match
    },
    {
      $project: {
        source: 1,
        "content.text": 1
      }
    }
  ])
  .then(list => list.map(comment => ({ id: comment.source.toString(), value: comment.content.text })))
}

const cleanTag = async (movieId) => {
  let tagMatch = {}
  let movieMatch = {}
  if(!!movieId) {
    tagMatch = {
      source: {
        $in: movieId
      }
    }
    movieMatch = {
      _id: movieId
    }
  }
  return Promise.all([
    TagModel.deleteMany(tagMatch),
    MovieModel.updateMany(movieMatch, {
      $set: { tag: [] }
    })
  ])
}

const generateTagData = async (config) => {
  const model = new TagModel(config)
  return model.save()
}

const extractWord = (text, topN=EXTRACT_KEYWORD_TOP_N) => {
  return nodejieba.extract(text, topN)
}

const setTag = async (dataList) => {
  return Promise.all(dataList.map(data => {
    const { id, value } = data
    const [ keyword ] = extractWord(value)
    if(!keyword) return false 
    return generateTagData({
      text: keyword.word,
      weight: keyword.weight,
      source: ObjectId(id)
    })
  }))
  .then(result => result.filter(item => !!item))
}

const updateMovieTag = (tagList) => {
  const movie2TagMap = tagList.reduce((acc, cur) => {
    const { source, _id, text } = cur
    if(!acc.has(source)) acc.set(source, [])
    const prev = acc.get(source)
    acc.set(source, [ ...prev, _id ])
    return acc
  }, new Map())

  const mapEntries = [...movie2TagMap.entries()]
  const keys = [...movie2TagMap.keys()]

  movie2TagMap.clear()

  return Promise.allSettled(keys.map(movieId => {
    const [ , tags ] = mapEntries.find(entry => {
      const [ key ] = entry
      return key.equals(movieId)
    })
    return MovieModel.updateOne({
      _id: movieId
    }, {
      $set: {
        tag: tags
      }
    })
  }))

}

function action(movieId) {
  return cleanTag(movieId)
  .then(() => {
    return collectComment(movieId)
  })
  .then(setTag)
  .then(updateMovieTag)
}

function scheduleMethod({
  test=false
}={}) {
  if(!nodejieba) return 
  console.log(chalk.magenta('数据标签tag定时审查'))

  //当前简单使用评论当做tag
  return action()
  .then(results => {
    const errors = results.filter(result => result.status === "rejected")
    if(!!errors.length) return Promise.reject({ errMsg: 'tag设置部分错误', list: errors })
  })
  .catch(err => {
    console.log(chalk.red('tag定时获取失败: ', JSON.stringify(err)))
    !!test && log4Error({
      __request_log_id__: '数据tag定时审查'
    }, err)
  })
}

const tagSchedule = () => {

  const { name, time } = CacheJson.tagSchedule

  const schedule = nodeSchedule.scheduleJob(name, time, scheduleMethod)

  return schedule 

}

module.exports = {
  schedule: tagSchedule,
  scheduleMethod,
  action
}