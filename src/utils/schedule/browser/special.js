const { SpecialModel } = require('../../mongodb/mongo.lib')

const MAX_COUNT = 500 

/** 
 * 将专题的浏览记录清除
 * 当浏览记录数量超过500
*/

async function specialDeal() {
  return SpecialModel.aggregate([
    {
      $match: {
        "glance.501": {
          $exists: true 
        }
      }
    },
    {
      $project: {
        _id: 1,
        glance: 1,
      }
    }
  ])
  .then(data => {
    return Promise.all(data.map(item => {
      const { _id, glance } = item 
      const glanceTotal = glance.length
      let update = {
        $set: {
          glance: glance.slice(glanceTotal - MAX_COUNT),
        }
      }
      return SpecialModel.updateOne({
        _id,
      }, update)
    }))
  })
}

module.exports = {
  specialDeal,
  MAX_COUNT
}