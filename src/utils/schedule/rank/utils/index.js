const { merge } = require('lodash')

const staticDeal = (record) => {

  return {
    sort: record.reduce((acc, cur) => {
      const { field, op } = cur
      acc[field] = op
      return acc
    }, {})
  }

}

const classifyDeal = (record) => {
  return record.reduce((acc, cur) => {
    const { origin_id } = cur
    if(!acc.filter["info.classify"]) acc.filter["info.classify"] = {
      $in: []
    }
    acc.filter["info.classify"]["$in"].push(origin_id)
    return acc
  }, {
    filter: {},
    sort: {}
  })
}

const RANK_TYPE_MAP = {
  movie: staticDeal,
  classify: classifyDeal
}

const rankOperation = (data) => {

  const { movie, classify } = data.reduce((acc, cur) => {
    const { origin } = cur
    acc[origin].push(cur)
    return acc 
  }, {
    movie: [],
    classify: []
  })

  const filterFields = merge({}, RANK_TYPE_MAP.movie(movie), RANK_TYPE_MAP.classify(classify))
  return filterFields
}

module.exports = {
  rankOperation
}