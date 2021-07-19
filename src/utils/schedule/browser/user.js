const { UserModel } = require('../../mongodb/mongo.lib')

/** 
 * 将用户被点赞及浏览电影记录清除
 * 浏览或被点赞记录超过500
*/

const LIMIT = 500

async function userDeal() {
  return UserModel.aggregate([
    {
      $match: {
        $or: [
          {
            [`glance.${LIMIT}`]: {
            }
          },
          {
            [`hot_history.${LIMIT}`]: {
              $exists: true 
            }
          },
        ]
      }
    },
    {
      $project: {
        _id: 1,
        glance: 1,
        hot_history: 1
      }
    }
  ])
  .then(data => {
    return Promise.all(data.map(item => {
      const { _id, glance, hot_history } = item 
      const glanceTotal = glance.length
      const hotTotal = hot_history.length
      let setFields = {}
      let update = {}
      if(glanceTotal > LIMIT) {
        setFields.glance = glance.slice(glanceTotal - LIMIT)
      }
      if(hotTotal > LIMIT) {
        setFields.hot_history = hot_history.slice(hotTotal - LIMIT)
      }
      update.$set = setFields
      return UserModel.updateOne({
        _id,
      }, update)
    }))
  })
}

module.exports = {
  userDeal,
  LIMIT
}