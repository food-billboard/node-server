const { SpecialModel } = require('../../mongodb/mongo.lib')

async function specialDeal() {
  return SpecialModel.aggregate([
    {
      $match: {
        $where: "this.glance.length > 500"
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
          glance: glance.slice(glanceTotal - 500),
        }
      }
      return SpecialModel.updateOne({
        _id,
      }, update)
    }))
  })
}

module.exports = {
  specialDeal
}