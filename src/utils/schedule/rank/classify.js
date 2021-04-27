const { ClassifyModel } = require('../../mongodb/mongo.lib')

const classifyDeal = async (rankList) => {

  return ClassifyModel.find({})
  .select({
    _id: 1,
    name: 1,
    icon: 1
  })
  .exec()
  .then(data => {
    const classList = [...data]
    const remove = rankList.filter(rank => rank.match_pattern.length == 1).reduce((acc, cur) => {
      const { match_pattern, _id: rankId } = cur 
      const [ { origin_id, origin } ] = match_pattern
      const index = classList.findIndex(cls => cls._id.equals(origin_id))
      if(!~index && origin == 'classify') acc.push(rankId)
      if(!!~index) classList.splice(index, 1)
      return acc
    }, [])
    return {
      remove,
      add: classList.map(cls => ({
        name: cls.name,
        icon: cls.icon,
        match_pattern: [{
          origin_id: cls._id,
          origin: "classify",
          field: "glance",
          op: 1
        }],
        glance: 0
      })),
    }
  })
}

module.exports = {
  classifyDeal
}

