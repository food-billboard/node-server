const Router = require('@koa/router')
const { MongoDB } = require('@src/utils')

const router = new Router()
const mongo = MongoDB()

router.get('/', async (ctx) => {
  const { currPage, pageSize, _id } = ctx.query
  let res
  let result
  const data = await mongo.find("_movie_", {
    query: [
      ["limit", pageSize],
      ["skip", pageSize * currPage]
    ],
    _id: mongo.dealId(_id),
  }, {
    comment: 1
  })
  .then(data => {
    return mongo.find("_comment_", {
      $or: data.map(id => ({_id: mongo.dealId(id)}))
    }, {
      sub_comments: 0,
      source: 0
    })
  })
  .then(data => {
    result = [...data]
    let listId = data.map(d => {
      const { user_info, comment_users } = d
      return [user_info, ...comment_users]
    })
    listId = listId.flat(Infinity)
    return mongo.find("_user_", {
      $or: [...listId.map(d => ({_id: mongo.dealId(d)}))]
    }, {
      avatar:1
    })
  })
  .then(data => {
    result.forEach((r, i) => {
      const { comment_users, user_info } = r
      let _comment_users = []
      let _user_info = ''
      data.forEach(d => {
        const { _id, avatar } = d
        let index = comment_users.indexOf(_id)
        if(user_info == _id) {
          _user_info = {
            _id: user_info,
            avatar: avatar
          }
        }
        if(index > -1) {
          _comment_users.push({
            _id,
            avatar
          })
        }
      })
      result[i] = { ...result[i], user_info: _user_info, comment_users: _comment_users }
    })
    return result
  })
  .catch(err => err)
  if(!isList) {
    res = {
      success: false,
      res: null
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