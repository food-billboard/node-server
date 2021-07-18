
const STATIC_RANK_MAP = [
  {
    name: '浏览',
    field: [
      {
        origin: "movie",
        field: "glance",
        op: 1
      }
    ]
  },
  {
    name: '点赞',
    field: [
      {
        origin: "movie",
        field: "hot",
        op: 1
      }
    ]
  },
  {
    name: '评分',
    field: [
      {
        origin: "movie",
        field: "total_rate",
        op: 1
      }
    ]
  },
  {
    name: '综合',
    field: [
      {
        origin: "movie",
        field: "glance",
        op: 1
      },
      {
        origin: "movie",
        field: "hot",
        op: 1
      },
      {
        origin: "movie",
        field: "total_rate",
        op: 1
      }
    ]
  },
]

const staticDeal = (rankList) => {

  let remove = []
  let add = []

  STATIC_RANK_MAP.forEach(rank => {
    const { name, field } = rank
    const target = rankList.find(rank => rank.name == name)
    if(!target) add.push({
      name,
      match_pattern: field,
      glance: 0
    })
  })

  return {
    remove,
    add
  }

}

module.exports = {
  staticDeal,
  STATIC_RANK_MAP
}