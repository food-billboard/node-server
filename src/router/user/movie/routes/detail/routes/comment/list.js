const Router = require('@koa/router')
const { MongoDB } = require('@src/utils')

const router = new Router()
const mongo = MongoDB()

router.get('/', async (ctx) => {
  const { currPage=0, pageSize=30, _id } = ctx.query
  let res
  let result
  let errMsg
  const data = await mongo.connect("movie")
  .then(db => db.findOne({
    _id: mongo.dealId(_id)
  }, {
    projection: {
      comment: 1
    }
  }))
  .then(data => {
    return mongo.connect("comment")
    .then(db => db.find({
      _id: { $in: [...data.comment] }
    }, {
      limit: pageSize,
      skip: pageSize * currPage,
      projection: {
        sub_comments: 0,
        source: 0,
        like_person: 0
      }
    }))
    .then(data => data.toArray())
  })
  .then(data => {
    result = [...data]
    let newListId = []
    let listId = data.map(d => {
      const { user_info, comment_users } = d
      return [user_info, ...comment_users]
    })
    listId.flat(Infinity).forEach(id => {
      if(!newListId.some(i => mongo.equalId(i, id))) newListId.push(id)
    })
    return mongo.connect("user")
    .then(db => db.find({
      _id: { $in:[...newListId] }
    }, {
      projection: {
        avatar: 1,
        username: 1
      }
    }))
    .then(data => data.toArray())
  })
  .then(data => {
    result.forEach((r, i) => {
      const { comment_users, user_info } = r
      let _comment_users = []
      let _user_info = false
      data.forEach(d => {
        const { _id, avatar, username } = d
        comment_users.forEach(c => {
          if(mongo.equalId(_id, c)) {
            _comment_users.push({
              _id,
              avatar
            })
          }
        })
        if(!_user_info && mongo.equalId(_id, user_info)) {
          _user_info = {
            _id,
            avatar,
            username
          }
        }
      })
      result[i] = { ...result[i], user_info: _user_info, comment_users: _comment_users }
    })
    return result
  })
  .catch(err => {
    errMsg = err
    return false
  })

  if(!data) {
    res = {
      success: false,
      res: {
        errMsg
      }
    }
  }else {
    res = {
      success: true,
      res: {
        data
      }
    }
  }
  ctx.body = JSON.stringify({res})
})

module.exports = router