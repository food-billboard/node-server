const { UserModel } = require('../../mongodb/mongo.lib')

async function userDeal() {
  return UserModel.aggregate([
    {
      $match: {
        $or: [
          {
            $where: "this.glance.length > 500"
          },
          {
            $where: "this.hot_history.length > 500"
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
      if(glanceTotal > 500) {
        setFields.glance = glance.slice(glanceTotal - 500)
      }
      if(hotTotal > 500) {
        setFields.hot_history = hot_history.slice(hotTotal - 500)
      }
      update.$set = setFields
      return UserModel.updateOne({
        _id,
      }, update)
    }))
  })
}

module.exports = {
  userDeal
}