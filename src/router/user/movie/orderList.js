const sortList = [
  // {
  //   name: '分类',
  //   _id: 'CLASSIFY'
  // },
  {
    name: '浏览',
    _id: 'GLANCE'
  },
  {
    name: '点赞',
    _id: 'HOT'
  },
  {
    name: '综合',
    _id: 'ALL'
  },
  {
    name: '评分',
    _id: 'RATE'
  },
  {
    name: '作者评分',
    _id: 'AUTHOR_RATE'
  }
  // {
  //   name: '评论',
  //   _id: 'COMMENT'
  // }
]

const sortDoc = {
  GLANCE: "glance",
  hot: 'hot',
  rate: 'rate',
  author_rate: 'author_rate'
}

module.exports = {
  sortList,
  sortDoc
}