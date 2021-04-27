const nodeSchedule = require('node-schedule')
const nodejieba = require('nodejieba')
const chalk = require('chalk')
const { Types: { ObjectId } } = require('mongoose')
const { log4Error } = require('@src/config/winston')
const { COMMENT_SOURCE_TYPE, EXTRACT_KEYWORD_TOP_N } = require('../constant')
const { MovieModel, TagModel, CommentModel } = require('../mongodb/mongo.lib')


const collecteComment = async () => {
  return CommentModel.aggregate([
    {
      $match: {
        source_type: COMMENT_SOURCE_TYPE.movie
      }
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

const cleanTag = async () => {
  return Promise.all([
    TagModel.deleteMany({}),
    MovieModel.updateMany({}, {
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
    return generateTagData({
      text: keyword.word,
      weight: keyword.weight,
      source: ObjectId(id)
    })
  }))
}

const updateMovieTag = (tagList) => {
  const movie2TagMap = tagList.reduce((acc, cur) => {
    const { source, _id } = cur
    if(!acc.has(source)) acc.set(source, [])
    const prev = acc.get(source)
    acc.set(source, [ ...prev, _id ])
    return acc
  }, new Map())

  const mapEntries = [...movie2TagMap.entries()]
  const keys = [...movie2TagMap.keys()]

  movie2TagMap.clear()

  return Promise.allSettled(keys.map(key => {
    const [ , tags ] = mapEntries.find(entry => {
      const [ key ] = entry
      return key.equals(key)
    })
    return MovieModel.updateOne({
      _id: key
    }, {
      $set: {
        tag: tags
      }
    })
  }))

}

function scheduleMethod() {
  console.log(chalk.magenta('数据标签tag定时审查'))

  //当前简单使用评论当做tag
  cleanTag()
  .then(collecteComment)
  .then(setTag)
  .then(updateMovieTag)
  .then(results => {
    const errors = results.filter(result => result.status === "rejected")
    if(!!errors.length) return Promise.reject({ errMsg: 'tag设置部分错误', list: errors })
  })
  .catch(err => {
    console.log(chalk.red('tag定时获取失败: ', JSON.stringify(err)))
    log4Error({
      __request_log_id__: '数据tag定时审查'
    }, err)
  })
}

const tagSchedule = () => {

  const schedule = nodeSchedule.scheduleJob('0  0  20  *  *  6', scheduleMethod)
}

module.exports = {
  tagSchedule
}